class SocketBuilder {
  constructor({ socketURL }) {
    this.socketURL = socketURL;
    this.onUserConnected = () => {};
    this.onUserDisconnected = () => {};
  }

  setOnUserConnected(fn) {
    this.onUserConnected = fn;
    return this;
  }

  setOnUserDisconnected(fn) {
    this.onUserDisConnected = fn;
    return this;
  }

  build() {
    const socket = io.connect(this.socketURL, {
      withCredentials: false,
    });

    console.log(this.onUserConnected);

    socket.on("user-connected", this.onUserConnected);
    socket.on("user-disconnected", this.onUserDisconnected);

    return socket;
  }
}
