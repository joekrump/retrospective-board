import ngrok from "ngrok";

if(process.env.NODE_ENV === "production") {
  (async function() {
    const url = await ngrok.connect({
      proto: 'http',
      addr: 8000,
    });

    console.log('Tunnel Created -> ', url);
    console.log('Tunnel Inspector ->  http://127.0.0.1:4040');
  })();
}
