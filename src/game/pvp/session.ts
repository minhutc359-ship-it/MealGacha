import { RoomPeer, randomKey, roomPeerId, validKey, type Wire } from "./peer"
import {
  ROOM_VERSION,
  admitGuest,
  applyRoomCommand,
  createHostRoom,
  roomView,
  setGuestConnected,
  surrenderRoom,
  tickRoom,
  validCommand,
  validProfile,
  type HostRoom,
  type Profile,
  type RoomCommand,
  type RoomMode,
  type RoomView,
} from "./room"
import { validRoomView } from "./viewValidation"
const RESUME = "som.pvp490.resume"
type Resume = { code: string; mode: RoomMode; token: string; name: string }
const validToken = (v: unknown): v is string =>
  typeof v === "string" && /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{32}$/.test(v)
export function savedRoom(): Resume | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(RESUME) ?? "null")
    return p &&
      validKey(p.code) &&
      ["tcg", "auto"].includes(p.mode) &&
      validToken(p.token) &&
      typeof p.name === "string"
      ? p
      : null
  } catch {
    return null
  }
}
export type SessionState = {
  status: "connecting" | "online" | "disconnected" | "closed"
  code: string
  host: boolean
  view: RoomView | null
  notice: string
  pending: boolean
}
export class RoomSession {
  private state: SessionState
  private listeners = new Set<() => void>()
  private room: HostRoom | null = null
  private peer: RoomPeer | null = null
  private wire: Wire | null = null
  private guestToken: string | null = null
  private token: string
  private seq = 0
  private pendingSeq = 0
  private lastPacket = Date.now()
  private lastBroadcast = 0
  private lastPing = 0
  private rate = { at: 0, count: 0 }
  private timer: ReturnType<typeof setInterval>
  private cooldown: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private visibility = () => {
    if (this.room) {
      this.room.connected[0] = !document.hidden
      this.room.revision++
      this.room.changedAt = [this.room.revision, this.room.revision]
      this.publish()
    }
  }
  private hide = () => this.shutdown(false)
  constructor(
    private mode: RoomMode,
    private profile: Profile,
    host: boolean,
    code = randomKey(),
    token = randomKey(32),
  ) {
    this.token = token
    this.state = {
      status: "connecting",
      code,
      host,
      view: null,
      notice: "Đang kết nối máy tạo phòng…",
      pending: false,
    }
    if (host) this.room = createHostRoom(mode, profile)
    else {
      try {
        sessionStorage.setItem(
          RESUME,
          JSON.stringify({ code, mode, token, name: profile.name }),
        )
      } catch {}
    }
    if (host) document.addEventListener("visibilitychange", this.visibility)
    window.addEventListener("pagehide", this.hide)
    this.timer = setInterval(() => this.pump(), 50)
    this.openPeer()
  }
  getSnapshot = () => this.state
  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit(patch: Partial<SessionState>) {
    if (this.disposed) return
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener()
  }
  private openPeer() {
    try {
      this.peer = new RoomPeer(
        this.state.host
          ? roomPeerId(this.state.code)
          : `som490-guest-${randomKey(24)}`,
        {
          onReady: () => {
            if (this.disposed) return
            if (this.state.host) {
              this.emit({
                status: "online",
                notice: "Phòng đã mở. Gửi mã cho một người bạn.",
              })
              this.publish()
            } else {
              this.emit({ notice: "Đang nối trực tiếp với chủ phòng…" })
              this.peer!.connect(roomPeerId(this.state.code))
            }
          },
          onConnection: (wire) => this.connected(wire),
          onError: (notice) => {
            if (!this.wire?.open && this.state.status !== "closed")
              this.emit({ status: "disconnected", pending: false, notice })
          },
        },
      )
    } catch (e) {
      this.emit({
        status: "disconnected",
        notice:
          e instanceof Error
            ? e.message
            : "Thiết bị chưa hỗ trợ kết nối phòng.",
      })
    }
  }
  private connected(wire: Wire) {
    if (this.disposed) {
      wire.close()
      return
    }
    if (this.state.host) {
      const handshake = setTimeout(() => wire.close(), 5000)
      wire.onClose = () => clearTimeout(handshake)
      wire.onData = (raw: unknown) => {
        if (!raw || typeof raw !== "object") return
        const p = raw as Record<string, unknown>
        if (p.kind !== "join") return
        clearTimeout(handshake)
        let error = ""
        if (p.v !== ROOM_VERSION || p.mode !== this.mode)
          error = "Hai người cần cùng chế độ và phiên bản web."
        else if (!validToken(p.token) || !validProfile(p.profile, this.mode))
          error = "Tên hoặc bộ bài không hợp lệ."
        else if (this.guestToken && this.guestToken !== p.token)
          error = "Phòng đã đủ 2 người. Ghế khách đang được giữ."
        else if (this.wire?.open && this.guestToken !== p.token)
          error = "Phòng đã đủ 2 người."
        else {
          if (this.wire) {
            this.wire.onClose = () => {}
            this.wire.close()
            this.wire = null
          }
          if (!this.guestToken)
            error = admitGuest(this.room!, p.profile as Profile) ?? ""
          else setGuestConnected(this.room!, true)
        }
        if (error) {
          wire.send({ kind: "rejected", message: error })
          setTimeout(() => wire.close(), 150)
          return
        }
        this.guestToken = p.token as string
        this.wire = wire
        this.lastPacket = Date.now()
        this.lastPing = 0
        wire.onData = (data) => this.receiveHost(data)
        wire.onClose = () => this.lost(wire)
        this.emit({ status: "online", notice: "Đã kết nối đủ hai người." })
        this.publish()
      }
    } else {
      this.wire = wire
      this.lastPacket = Date.now()
      this.lastPing = 0
      wire.onData = (data) => this.receiveGuest(data)
      wire.onClose = () => this.lost(wire)
      wire.send({
        kind: "join",
        v: ROOM_VERSION,
        mode: this.mode,
        token: this.token,
        profile: this.profile,
      })
    }
  }
  private lost(wire: Wire) {
    if (this.disposed || this.wire !== wire) return
    this.wire = null
    if (this.state.status === "closed") return
    if (!this.room && this.state.view) {
      const v = this.state.view
      this.emit({
        view: { ...v, connected: [v.connected[0], false], canAct: false },
      })
    }
    if (this.room) {
      setGuestConnected(this.room, false)
      this.publish()
    }
    this.emit({
      status: "disconnected",
      pending: false,
      notice:
        "Mất kết nối · trận đang tạm dừng. Ghế khách được giữ để nối lại.",
    })
  }
  private receiveHost(raw: unknown) {
    if (!raw || typeof raw !== "object") return
    const p = raw as Record<string, unknown>
    this.lastPacket = Date.now()
    if (p.kind === "ping") {
      this.wire?.send({ kind: "pong" })
      return
    }
    if (p.kind === "pong") return
    if (p.kind === "leave") {
      const room = this.room!
      if (room.phase === "playing") surrenderRoom(room, 1)
      room.profiles[1] = null
      room.connected[1] = false
      room.ready[1] = false
      room.lastSequence[1] = 0
      room.revision++
      room.changedAt = [room.revision, room.revision]
      this.guestToken = null
      const old = this.wire
      this.wire = null
      if (old) {
        old.onClose = () => {}
        setTimeout(() => old.close(), 150)
      }
      this.emit({
        status: "online",
        notice: "Khách đã rời phòng. Bạn có thể mời người khác.",
      })
      this.publish()
      return
    }
    if (
      p.kind !== "command" ||
      p.id !== this.room!.id ||
      !Number.isSafeInteger(p.seq) ||
      !Number.isSafeInteger(p.revision) ||
      !validCommand(p.command)
    )
      return
    const now = Date.now()
    if (now - this.rate.at > 1000) this.rate = { at: now, count: 0 }
    const error =
      ++this.rate.count > 20
        ? "Bạn thao tác quá nhanh."
        : applyRoomCommand(
            this.room!,
            1,
            p.command,
            Number(p.seq),
            Number(p.revision),
            now,
          )
    if (error) this.wire?.send({ kind: "error", ack: p.seq, message: error })
    this.publish()
    this.scheduleCooldown()
  }
  private receiveGuest(raw: unknown) {
    if (!raw || typeof raw !== "object") return
    const p = raw as Record<string, unknown>
    this.lastPacket = Date.now()
    if (p.kind === "ping") {
      this.wire?.send({ kind: "pong" })
      return
    }
    if (p.kind === "pong") return
    if (p.kind === "view") {
      if (
        !validRoomView(p.view) ||
        p.view.mode !== this.mode ||
        p.view.seat !== 1 ||
        !Number.isSafeInteger(p.ack) ||
        Number(p.ack) < 0
      ) {
        this.emit({
          notice: "Dữ liệu phòng không hợp lệ. Hãy dùng cùng phiên bản web.",
        })
        return
      }
      if (
        this.state.view &&
        p.view.id === this.state.view.id &&
        p.view.revision < this.state.view.revision
      )
        return
      this.seq = Math.max(this.seq, Number(p.ack))
      this.emit({
        status: "online",
        view: p.view,
        pending: Number(p.ack) < this.pendingSeq,
        notice: "",
      })
      this.scheduleCooldown()
      return
    }
    if (p.kind === "error" && typeof p.message === "string") {
      this.seq = Math.max(this.seq, Number(p.ack) || 0)
      this.emit({ pending: false, notice: p.message.slice(0, 200) })
    }
    if (p.kind === "rejected" || p.kind === "closed") {
      try {
        sessionStorage.removeItem(RESUME)
      } catch {}
      this.emit({
        status: "closed",
        pending: false,
        notice:
          typeof p.message === "string"
            ? p.message.slice(0, 200)
            : "Chủ phòng đã đóng phòng.",
      })
    }
  }
  private publish() {
    if (!this.room) return
    this.emit({ view: roomView(this.room, 0) })
    this.wire?.send({
      kind: "view",
      view: roomView(this.room, 1),
      ack: this.room.lastSequence[1],
    })
    this.lastBroadcast = Date.now()
  }
  private scheduleCooldown() {
    if (this.cooldown) clearTimeout(this.cooldown)
    const delay = this.state.view?.cooldownMs ?? 0
    if (!delay) return
    const revision = this.state.view!.revision
    this.cooldown = setTimeout(() => {
      if (this.room) this.publish()
      else if (this.state.view?.revision === revision) {
        const v = this.state.view,
          b = v.tcg
        this.emit({
          view: {
            ...v,
            cooldownMs: 0,
            canAct:
              v.phase === "playing" &&
              v.connected.every(Boolean) &&
              !!b &&
              (b.pendingReaction
                ? b.pvp?.reactionOwner === "player"
                : b.turnSide === "player"),
          },
        })
      }
    }, delay + 25)
  }
  private pump() {
    if (this.disposed) return
    const now = Date.now()
    if (this.wire?.open) {
      if (now - this.lastPing >= 2000) {
        this.lastPing = now
        this.wire.send({ kind: "ping" })
      }
      if (now - this.lastPacket > 20000) this.wire.close()
    }
    if (this.room && !document.hidden) {
      const revision = this.room.revision
      if (
        tickRoom(this.room) &&
        (now - this.lastBroadcast >= 100 || revision !== this.room.revision)
      )
        this.publish()
    }
  }
  command(command: RoomCommand): boolean {
    const v = this.state.view
    if (
      !v ||
      this.state.pending ||
      this.state.status === "closed" ||
      !validCommand(command)
    )
      return false
    if (this.room) {
      const error = applyRoomCommand(
        this.room,
        0,
        command,
        ++this.seq,
        v.revision,
      )
      if (error) {
        this.emit({ notice: error })
        return false
      }
      this.emit({ notice: "" })
      this.publish()
      this.scheduleCooldown()
      return true
    }
    if (!this.wire?.open) {
      this.emit({ notice: "Hãy nối lại với chủ phòng." })
      return false
    }
    this.pendingSeq = ++this.seq
    this.emit({ pending: true, notice: "" })
    return this.wire.send({
      kind: "command",
      id: v.id,
      seq: this.seq,
      revision: v.revision,
      command,
    })
  }
  reconnect() {
    if (this.disposed || this.wire?.open) return
    this.peer?.close()
    this.emit({
      status: "connecting",
      pending: false,
      notice: "Đang kết nối lại…",
    })
    this.openPeer()
  }
  close() {
    this.shutdown(true)
  }
  private shutdown(intentional: boolean) {
    if (this.disposed) return
    if (this.state.host)
      this.wire?.send({ kind: "closed", message: "Chủ phòng đã đóng phòng." })
    else if (intentional) {
      this.wire?.send({ kind: "leave" })
      try {
        sessionStorage.removeItem(RESUME)
      } catch {}
    }
    this.disposed = true
    clearInterval(this.timer)
    if (this.cooldown) clearTimeout(this.cooldown)
    window.removeEventListener("pagehide", this.hide)
    document.removeEventListener("visibilitychange", this.visibility)
    if (this.wire) this.wire.onClose = () => {}
    setTimeout(() => this.peer?.close(), 150)
  }
}
