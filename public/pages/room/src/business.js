class Business {
  constructor({ room, media, view, socketBuilder, peerBuilder }) {
    this.room = room;
    this.media = media;
    this.view = view;

    this.peerBuilder = peerBuilder;

    this.socketBuilder = socketBuilder;

    this.currentStream = {};
    this.currentPeer = {};
    this.socket = {};

    this.peers = new Map();
    this.usersRecords = new Map();
  }

  static initialize(deps) {
    const instance = new Business(deps);
    return instance._init();
  }

  async _init() {
    this.view.configureRecordButton(this.onRecordPressed.bind(this));
    this.view.configureLeaveButton(this.onLeavePressed.bind(this));

    this.currentStream = await this.media.getCamera(true);

    this.socket = this.socketBuilder
      .setOnUserConnected(this.onUserConnected())
      .setOnUserDisconnected(this.onUserDisconnected())
      .build();

    this.currentPeer = await this.peerBuilder
      .setOnError(this.onPeerError())
      .setOnConnectionOpened(this.onPeerConnectionOpened())
      .setOnCallReceived(this.onPeerCallReceived())
      .setOnStreamReceived(this.onPeerStreamReceived())
      .setOnCallError(this.onPeerCallError())
      .setOnCallClose(this.onPeerCallClose())
      .build();

    this.addVideoStream(this.currentPeer.id);
  }

  addVideoStream(userId, stream = this.currentStream) {
    const recorderInstance = new Recorder(userId, stream);
    this.usersRecords.set(recorderInstance.filename, recorderInstance);
    if (this.recordingEnabled) {
      recorderInstance.startRecording();
    }

    const isCurrentId = userId === this.currentPeer.id;
    this.view.renderVideo({
      userId,
      // muted: false,
      stream,
      isCurrentId,
    });
  }

  onUserConnected() {
    return (userId) => {
      console.log("user connected!", userId);
      this.currentPeer.call(userId, this.currentStream);
    };
  }

  onUserDisconnected() {
    return (userId) => {
      if (this.peers.has(userId)) {
        this.peers.get(userId).call.close();
        this.peers.delete(userId);
      }
      this.view.setParticipants(this.peers.size);
      this.stopRecording(userId);
      this.view.removeVideoElement(userId);
    };
  }

  onPeerError() {
    return (error) => {
      console.error("Error on peer!", error);
    };
  }

  onPeerConnectionOpened() {
    return (peer) => {
      const id = peer.id;
      console.log("peer", peer);
      this.socket.emit("join-room", this.room, id);
    };
  }

  onPeerCallReceived() {
    return (call) => {
      console.log("answering call", call);
      call.answer(this.currentStream);
    };
  }

  onPeerStreamReceived() {
    return (call, stream) => {
      console.log("add stream");
      const callerId = call.peer;
      if (this.peers.has(callerId)) return;
      this.addVideoStream(callerId, stream);
      this.peers.set(callerId, { call });
      this.view.setParticipants(this.peers.size);
    };
  }

  onPeerCallError() {
    return (call, error) => {
      this.view.removeVideoElement(call.peer);
    };
  }

  onPeerCallClose() {
    return (call) => {
      // this.view.removeElement(call.peer);
    };
  }

  onRecordPressed(recordingEnabled) {
    this.recordingEnabled = recordingEnabled;
    console.log("pressionou!", this.recordingEnabled);
    for (const [key, value] of this.usersRecords) {
      if (this.recordingEnabled) {
        value.startRecording();
        continue;
      }
      this.stopRecording(key);
    }
  }

  async stopRecording(userId) {
    const usersRecordings = this.usersRecords;
    for (const [key, value] of usersRecordings) {
      const isContextUser = key.includes(userId);
      if (!isContextUser) continue;

      const rec = value;
      const isRecordingActive = rec.recordingActive;
      if (!isRecordingActive) continue;

      await rec.stopRecording();
      this.playRecordings(key);
    }
  }

  playRecordings(userId) {
    const user = this.usersRecords.get(userId);
    const videosURLs = user.getAllVideoURLs();
    videosURLs.map((url) => {
      this.view.renderVideo({ url, userId });
    });
  }

  onLeavePressed() {
    this.usersRecords.forEach((value, key) => value.download());
  }
}
