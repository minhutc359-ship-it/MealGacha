package io.github.minhutc359.soulofmeal;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override protected void load() {
        super.load();
        // Register before the Activity returns to the event loop and bundled JS executes.
        bridge.getWebView().addJavascriptInterface(new DurableProgress(this),"NativeProgress");
    }
}
