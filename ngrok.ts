import ngrok from "ngrok";

if(process.env.NODE_ENV === "production") {
  (async function() {
    const open = require("open");
    const url = await ngrok.connect({
      proto: 'http',
      addr: 8000,
    });

    console.log('Tunnel Created -> \x1b[34m%s\x1b[0m', url);
    console.log('Tunnel Inspector ->  http://127.0.0.1:4040');

    // Opens the URL in the default browser.
    try {
      await open(url);
    } catch {
      console.warn(
        `Unable to open "${url}" in browser.`
      );
    }
  })();
}
