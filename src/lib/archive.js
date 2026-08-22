import JSZip from "jszip";

/** Bundle samples into a zip and hand it to the browser as a download. */
export async function downloadSamplesZip(samples, className) {
  if (samples.length === 0) return;

  const zip = new JSZip();
  const cleanName = (className || "class").trim() || "class";

  samples.forEach((sample, index) => {
    zip.file(`${cleanName}_${index + 1}.jpg`, sample.blob);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${cleanName}.zip`;
  link.click();

  URL.revokeObjectURL(url);
}
