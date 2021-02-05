const onload = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get("room");
  console.log("this is the room", room);

  // const recorderBtn = document.getElementById('record')
  // recorderBtn.addEventListener('click', recordClick(recorderBtn))

  const socketURL = "http://localhost:3000";
  const socketBuilder = new SocketBuilder({ socketURL });

  const peerConfig = Object.values({
    id: undefined,
    options: {
      port: 9000,
      host: "localhost",
      path: "/",
    },
  });
  const peerBuilder = new PeerBuilder({ peerConfig });

  const view = new View();
  const media = new Media();
  const deps = {
    view,
    media,
    room,
    socketBuilder,
    peerBuilder,
  };

  Business.initialize(deps);
};

window.onload = onload;
