class Recorder {
  constructor(userName, stream) {
    this.userName = userName;
    this.stream = stream;

    this.filename = `id:${userName}-when:${Date.now()}`;
    this.videoType = "video/webm";

    this.mediaRecorder = {};
    this.recordedBlobs = [];
    this.completeRecordings = [];
    this.recordingActive = false;
  }

  _setup() {
    const commonsCodecs = ["codecs=vp9,opus", "codecs=vp8,opus", ""];

    const options = commonsCodecs
      .map((codec) => ({
        mimeType: `${this.videoType};${codec}`,
      }))
      .find((option) => MediaRecorder.isTypeSupported(option.mimeType));

    if (!options) {
      throw new Error(
        `Este navegador não tem suporte a nenhum dos codecs utilizados nesta aplicação (${commonsCodecs.join(
          ", "
        )}).`
      );
    }

    return options;
  }

  startRecording() {
    const options = this._setup();
    if (!this.stream.active) return;
    this.mediaRecorder = new MediaRecorder(this.stream, options);
    console.log(
      `Created MediaRecorder ${this.mediaRecorder} with options ${options}.`
    );

    this.mediaRecorder.onstop = (evt) => {
      console.log("Recorded blobs", this.recordedBlobs);
    };

    this.mediaRecorder.ondataavailable = (evt) => {
      if (!evt.data || !evt.data.size) return;

      this.recordedBlobs.push(evt.data);
    };

    this.mediaRecorder.start();
    console.log(`Media record started`, this.mediaRecorder);
    this.recordingActive = true;
  }

  async stopRecording() {
    if (!this.recordingActive) return;
    if (this.mediaRecorder.state === "inactive") return;

    console.log(`Media record stopped!`, this.userName);
    this.mediaRecorder.stop();

    this.recordingActive = false;
    await Util.sleep(200);
    this.completeRecordings.push([...this.recordedBlobs]);
    this.recordedBlobs = [];
  }

  getAllVideoURLs() {
    return this.completeRecordings.map((recording) => {
      const superBuffer = new Blob(recording, { type: this.videoType });

      return window.URL.createObjectURL(superBuffer);
    });
  }

  download() {
    if (!this.completeRecordings.length) return;

    for (const recording of this.completeRecordings) {
      const blob = new Blob(recording, { type: this.videoType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${this.filename}.webm`;
      document.body.appendChild(a);
      a.click();
    }
  }
}
