package io.github.minhutc359.soulofmeal;

import android.content.Context;
import android.util.AtomicFile;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/** Private AtomicFile, with commit-before-return semantics for the existing JS journal. */
public final class DurableProgress {
    private final AtomicFile file;
    private JSONObject values;
    public DurableProgress(Context context) {
        file = new AtomicFile(new File(context.getFilesDir(), "progress-v4.json"));
        try {
            if (!file.getBaseFile().exists() && !new File(file.getBaseFile()+".bak").exists()) values = new JSONObject();
            else values = new JSONObject(new String(file.readFully(), StandardCharsets.UTF_8));
        } catch (Exception error) { values = null; } // Preserve corrupt bytes and block JS bootstrap.
    }
    @JavascriptInterface public synchronized String readAll() { return values == null ? "null" : values.toString(); }
    @JavascriptInterface public synchronized String readRaw() {
        try {return new String(file.readFully(), StandardCharsets.UTF_8);} catch(Exception error) {return "";}
    }
    private boolean commit(JSONObject next) {
        FileOutputStream stream = null;
        try {
            byte[] bytes=next.toString().getBytes(StandardCharsets.UTF_8);
            if(bytes.length>32*1024*1024) return false;
            stream=file.startWrite();stream.write(bytes);file.finishWrite(stream);values=next;return true;
        } catch(Exception error) { if(stream!=null)file.failWrite(stream);return false; }
    }
    @JavascriptInterface public synchronized boolean setItem(String key,String value) {
        if(values==null || key==null || value==null || key.length()>200 || value.length()>12*1024*1024)return false;
        try {JSONObject next=new JSONObject(values.toString());next.put(key,value);return commit(next);}catch(Exception error){return false;}
    }
    @JavascriptInterface public synchronized boolean removeItem(String key) {
        if(values==null)return false;
        try {JSONObject next=new JSONObject(values.toString());next.remove(key);return commit(next);}catch(Exception error){return false;}
    }
    @JavascriptInterface public synchronized boolean clear() {return values!=null && commit(new JSONObject());}
}
