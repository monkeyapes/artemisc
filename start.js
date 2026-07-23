import("./server/dist/index.js").catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
