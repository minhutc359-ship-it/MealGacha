/** Native data channels; PeerServer only brokers SDP/ICE, never match snapshots. */
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
export function randomKey(length = 16) {
  return Array.from(
    crypto.getRandomValues(new Uint8Array(length)),
    (n) => CODE_ALPHABET[n % 32],
  ).join("")
}
export const normalizeKey = (key: string) =>
  key.toUpperCase().replace(/[\s-]/g, "")
export const validKey = (key: string) =>
  key.length === 16 && [...key].every((c) => CODE_ALPHABET.includes(c))
export const formatKey = (key: string) => key.match(/.{1,4}/g)?.join("-") ?? key
export const roomPeerId = (key: string) => `som490-${key}`
export type Wire = {
  id: string
  open: boolean
  send: (data: unknown) => boolean
  close: () => void
  onData: (data: unknown) => void
  onClose: () => void
}
type Options = {
  onReady: () => void
  onConnection: (wire: Wire) => void
  onError: (message: string) => void
  signalUrl?: string
  iceServers?: RTCIceServer[]
}
type Signal = {
  type: string
  src?: string
  dst?: string
  payload?: {
    connectionId?: string
    type?: string
    sdp?: RTCSessionDescriptionInit
    candidate?: RTCIceCandidateInit
    msg?: string
  }
}
type Link = {
  remote: string
  pc: RTCPeerConnection
  wire: Wire
  candidates: RTCIceCandidateInit[]
  timeout: ReturnType<typeof setTimeout>
  channel: RTCDataChannel | null
  finished: boolean
}
export class RoomPeer {
  private socket: WebSocket
  private links = new Map<string, Link>()
  private heartbeat: ReturnType<typeof setInterval> | null = null
  private opening: ReturnType<typeof setTimeout>
  private disposed = false
  constructor(
    private id: string,
    private options: Options,
  ) {
    let url: URL
    try {
      url = new URL(
        options.signalUrl ??
          import.meta.env.VITE_PVP_SIGNAL_URL ??
          "wss://0.peerjs.com/peerjs",
      )
      if (!["ws:", "wss:"].includes(url.protocol)) throw Error()
    } catch {
      throw Error("Địa chỉ máy kết nối phòng chưa hợp lệ.")
    }
    url.searchParams.set("key", "peerjs")
    url.searchParams.set("id", id)
    url.searchParams.set("token", randomKey(32))
    url.searchParams.set("version", "1.5.5")
    this.socket = new WebSocket(url)
    this.opening = setTimeout(
      () =>
        this.error(
          "Không kết nối được máy tạo phòng. Hãy thử lại hoặc kiểm tra mạng.",
        ),
      15000,
    )
    this.socket.onmessage = (event) => {
      if (typeof event.data !== "string" || event.data.length > 100000) return
      try {
        this.receive(JSON.parse(event.data))
      } catch {
        this.error("Không thể thương lượng kết nối phòng.")
      }
    }
    this.socket.onerror = () =>
      this.error("Không kết nối được máy tạo phòng. Hãy kiểm tra mạng.")
    this.socket.onclose = () => {
      if (!this.disposed && ![...this.links.values()].some((l) => l.wire.open))
        this.error("Máy kết nối phòng đã ngắt. Hãy kết nối lại.")
    }
  }
  private error(message: string) {
    if (!this.disposed) this.options.onError(message)
  }
  private signal(type: string, remote: string, payload: object) {
    if (this.socket.readyState === WebSocket.OPEN)
      this.socket.send(JSON.stringify({ type, dst: remote, payload }))
  }
  private receive(message: Signal) {
    if (message.type === "OPEN") {
      clearTimeout(this.opening)
      this.heartbeat = setInterval(() => {
        if (this.socket.readyState === 1)
          this.socket.send('{"type":"HEARTBEAT"}')
      }, 5000)
      this.options.onReady()
      return
    }
    if (["ID-TAKEN", "INVALID-KEY", "ERROR"].includes(message.type)) {
      this.error("Mã phòng chưa khả dụng. Hãy tạo hoặc kết nối lại phòng.")
      return
    }
    const p = message.payload
    if (
      !message.src ||
      !p?.connectionId ||
      p.type !== "data" ||
      p.connectionId.length > 100
    )
      return
    if (message.type === "OFFER" && p.sdp) {
      if (this.links.has(p.connectionId) || this.links.size >= 3) return
      const link = this.makeLink(message.src, p.connectionId)
      link.pc.ondatachannel = (e) => this.attach(link, e.channel)
      void (async () => {
        try {
          await link.pc.setRemoteDescription(p.sdp!)
          await this.flushCandidates(link)
          const answer = await link.pc.createAnswer()
          await link.pc.setLocalDescription(answer)
          this.signal("ANSWER", link.remote, {
            type: "data",
            connectionId: link.wire.id,
            sdp: answer,
          })
        } catch {
          link.wire.close()
        }
      })()
      return
    }
    const link = this.links.get(p.connectionId)
    if (!link || link.remote !== message.src) return
    if (message.type === "ANSWER" && p.sdp)
      void (async () => {
        try {
          await link.pc.setRemoteDescription(p.sdp!)
          await this.flushCandidates(link)
        } catch {
          link.wire.close()
        }
      })()
    else if (message.type === "CANDIDATE" && p.candidate) {
      if (link.pc.remoteDescription)
        void link.pc.addIceCandidate(p.candidate).catch(() => {})
      else if (link.candidates.length < 80) link.candidates.push(p.candidate)
    }
  }
  private async flushCandidates(link: Link) {
    for (const candidate of link.candidates.splice(0))
      await link.pc.addIceCandidate(candidate).catch(() => {})
  }
  private makeLink(remote: string, connectionId: string): Link {
    let iceServers = this.options.iceServers
    if (!iceServers && import.meta.env.VITE_PVP_ICE_SERVERS) {
      try {
        iceServers = JSON.parse(import.meta.env.VITE_PVP_ICE_SERVERS)
      } catch {
        throw Error("Cấu hình mạng phòng không hợp lệ.")
      }
    }
    const pc = new RTCPeerConnection({
      iceServers: iceServers ?? [{ urls: "stun:stun.l.google.com:19302" }],
    })
    const wire: Wire = {
      id: connectionId,
      open: false,
      send: () => false,
      close: () => this.end(link),
      onData: () => {},
      onClose: () => {},
    }
    const link: Link = {
      remote,
      pc,
      wire,
      candidates: [],
      channel: null,
      finished: false,
      timeout: setTimeout(() => {
        this.error(
          "Hai thiết bị chưa nối được trực tiếp. Mạng này có thể cần máy chuyển tiếp TURN.",
        )
        wire.close()
      }, 25000),
    }
    this.links.set(connectionId, link)
    pc.onicecandidate = (event) => {
      if (event.candidate)
        this.signal("CANDIDATE", remote, {
          type: "data",
          connectionId,
          candidate: event.candidate.toJSON(),
        })
    }
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState))
        wire.close()
    }
    return link
  }
  connect(remote: string) {
    const link = this.makeLink(remote, `dc_${randomKey(24)}`)
    this.attach(link, link.pc.createDataChannel("som-room", { ordered: true }))
    void (async () => {
      try {
        const offer = await link.pc.createOffer()
        await link.pc.setLocalDescription(offer)
        this.signal("OFFER", remote, {
          type: "data",
          connectionId: link.wire.id,
          sdp: offer,
          reliable: true,
          serialization: "json",
          label: "som-room",
        })
      } catch {
        link.wire.close()
      }
    })()
  }
  private attach(link: Link, channel: RTCDataChannel) {
    link.channel = channel
    const queue: string[] = []
    let queued = 0
    let assembly: {
      id: string
      n: number
      parts: string[]
      size: number
    } | null = null
    const pump = () => {
      while (
        queue.length &&
        channel.readyState === "open" &&
        channel.bufferedAmount < 65536
      ) {
        const part = queue.shift()!
        queued -= part.length
        try {
          channel.send(part)
        } catch {
          link.wire.close()
          return
        }
      }
    }
    channel.bufferedAmountLowThreshold = 32768
    channel.onbufferedamountlow = pump
    link.wire.send = (data) => {
      if (!link.wire.open) return false
      let raw: string
      try {
        raw = JSON.stringify(data)
      } catch {
        return false
      }
      if (!raw || raw.length > 1000000 || queued + raw.length * 2 > 2000000) {
        link.wire.close()
        return false
      }
      const parts =
        raw.length > 8000
          ? Array.from({ length: Math.ceil(raw.length / 8000) }, (_, i) =>
              raw.slice(i * 8000, (i + 1) * 8000),
            )
          : null
      const id = randomKey(12),
        packets = parts
          ? parts.map((d, i) =>
              JSON.stringify({ fragment: id, i, n: parts.length, d }),
            )
          : [raw]
      for (const packet of packets) {
        queue.push(packet)
        queued += packet.length
      }
      pump()
      return true
    }
    channel.onmessage = (event) => {
      if (typeof event.data !== "string" || event.data.length > 20000) {
        link.wire.close()
        return
      }
      try {
        const data = JSON.parse(event.data)
        if (data && typeof data === "object" && "fragment" in data) {
          if (
            typeof data.fragment !== "string" ||
            data.fragment.length !== 12 ||
            !Number.isInteger(data.i) ||
            !Number.isInteger(data.n) ||
            data.n < 2 ||
            data.n > 125 ||
            typeof data.d !== "string" ||
            data.d.length > 8000
          )
            throw Error()
          if (data.i === 0) {
            if (assembly) throw Error()
            assembly = { id: data.fragment, n: data.n, parts: [], size: 0 }
          }
          if (
            !assembly ||
            assembly.id !== data.fragment ||
            assembly.n !== data.n ||
            assembly.parts.length !== data.i
          )
            throw Error()
          assembly.parts.push(data.d)
          assembly.size += data.d.length
          if (assembly.size > 1000000) throw Error()
          if (assembly.parts.length === assembly.n) {
            const raw = assembly.parts.join("")
            assembly = null
            link.wire.onData(JSON.parse(raw))
          }
        } else {
          if (assembly) throw Error()
          link.wire.onData(data)
        }
      } catch {
        link.wire.close()
      }
    }
    channel.onopen = () => {
      if (link.finished) return
      clearTimeout(link.timeout)
      link.wire.open = true
      this.options.onConnection(link.wire)
      pump()
    }
    channel.onclose = () => link.wire.close()
    channel.onerror = () => link.wire.close()
  }
  private end(link: Link) {
    if (link.finished) return
    link.finished = true
    clearTimeout(link.timeout)
    link.wire.open = false
    link.channel?.close()
    link.pc.close()
    this.links.delete(link.wire.id)
    link.wire.onClose()
  }
  close() {
    if (this.disposed) return
    this.disposed = true
    clearTimeout(this.opening)
    if (this.heartbeat) clearInterval(this.heartbeat)
    for (const link of this.links.values()) this.end(link)
    this.socket.close()
  }
}
