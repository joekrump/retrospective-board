import ngrok from "ngrok";

if(process.env.NODE_ENV === "production") {
  (async function() {
    const url = await ngrok.connect({
      proto: 'http',
      addr: 8000,
    });

    console.log('Tunnel Created -> \x1b[34m%s\x1b[0m', url);
    console.log('Tunnel Inspector ->  http://127.0.0.1:4040');
  })();
}
