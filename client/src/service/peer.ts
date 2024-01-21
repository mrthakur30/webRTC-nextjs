class PeerService {
  peer: RTCPeerConnection | null;

  constructor() {
    this.peer = this.createPeerConnection();
  }

  private createPeerConnection(): RTCPeerConnection | null {
    try {
      return new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Error creating RTCPeerConnection:", error);
      return null;
    }
  }

  async getAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | undefined> {
    if (this.peer) {
      try {
        await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await this.peer.createAnswer();
        await this.peer.setLocalDescription(new RTCSessionDescription(ans));
        return ans;
      } catch (error) {
        console.error("Error creating answer:", error);
      }
    }
  }

  async setLocalDescription(ans: RTCSessionDescriptionInit): Promise<void> {
    if (this.peer) {
      try {
        await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
      } catch (error) {
        console.error("Error setting local description:", error);
      }
    }
  }

  async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (this.peer) {
      try {
        const offer = await this.peer.createOffer();
        await this.peer.setLocalDescription(new RTCSessionDescription(offer));
        return offer;
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    }
  }
}

const peerServiceInstance = new PeerService();
export default peerServiceInstance;
