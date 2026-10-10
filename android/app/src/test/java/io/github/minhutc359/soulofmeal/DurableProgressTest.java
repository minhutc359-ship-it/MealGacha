package io.github.minhutc359.soulofmeal;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import android.content.Context;
import java.io.File;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=36)
public class DurableProgressTest {
 @Test public void committedDataSurvivesNewInstance() throws Exception {
  Context context=RuntimeEnvironment.getApplication();new File(context.getFilesDir(),"progress-v4.json").delete();
  DurableProgress first=new DurableProgress(context);
  assertTrue(first.setItem("save","{\"coins\":7654}"));
  assertEquals(first.readAll(),new DurableProgress(context).readAll());
  assertTrue(first.removeItem("save"));assertEquals("{}",new DurableProgress(context).readAll());
 }
 @Test public void corruptionIsPreservedAndRefusesAllWrites() throws Exception {
  Context context=RuntimeEnvironment.getApplication();File file=new File(context.getFilesDir(),"progress-v4.json");
  Files.write(file.toPath(),"{broken".getBytes(StandardCharsets.UTF_8));
  DurableProgress store=new DurableProgress(context);assertEquals("null",store.readAll());
  assertFalse(store.setItem("save","fresh"));assertFalse(store.clear());
  assertEquals("{broken",new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8));
  assertEquals("{broken",store.readRaw());
 }
 @Test public void rejectedOversizedWriteKeepsCommittedBytes() throws Exception {
  Context context=RuntimeEnvironment.getApplication();new File(context.getFilesDir(),"progress-v4.json").delete();
  DurableProgress store=new DurableProgress(context);assertTrue(store.setItem("save","old"));String before=store.readAll();
  assertFalse(store.setItem("save","x".repeat(12*1024*1024+1)));
  assertEquals(before,new DurableProgress(context).readAll());
 }
 @Test public void interruptedWritesAndBackupRecoveryKeepAcknowledgedData() throws Exception {
  Context context=RuntimeEnvironment.getApplication();File file=new File(context.getFilesDir(),"progress-v4.json");
  String safe="{\"save\":\"acknowledged\"}";
  Files.write(file.toPath(),safe.getBytes(StandardCharsets.UTF_8));
  Files.write(new File(file+".new").toPath(),"{partial".getBytes(StandardCharsets.UTF_8));
  assertEquals(safe,new DurableProgress(context).readAll());
  Files.write(new File(file+".bak").toPath(),safe.getBytes(StandardCharsets.UTF_8));
  Files.write(file.toPath(),"{broken".getBytes(StandardCharsets.UTF_8));
  assertEquals(safe,new DurableProgress(context).readAll());
 }
}
