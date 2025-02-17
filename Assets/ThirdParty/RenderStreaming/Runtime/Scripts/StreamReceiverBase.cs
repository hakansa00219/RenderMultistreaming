using System;
using System.Collections.Generic;
using System.Linq;
using Unity.WebRTC;
using UnityEngine;

namespace Unity.RenderStreaming
{
    /// <summary>
    ///
    /// </summary>
    public abstract class StreamReceiverBase : MonoBehaviour, IStreamReceiver
    {
        /// <summary>
        ///
        /// </summary>
        public RTCRtpTransceiver Transceiver => m_transceiver;

        // public RTCRtpTransceiver GetTransceiver(string connectionId) => m_transceivers[connectionId];

        // public Dictionary<string, RTCRtpTransceiver> Transceivers => m_transceivers;

        /// <summary>
        ///
        /// </summary>
        public OnStartedStreamHandler OnStartedStream { get; set; }

        /// <summary>
        ///
        /// </summary>
        public OnStoppedStreamHandler OnStoppedStream { get; set; }

        /// <summary>
        ///
        /// </summary>
        public MediaStreamTrack Track => m_track;

        public int streamIndex = 0;
        // public MediaStreamTrack GetTrack(string connectionId) => m_tracks[connectionId];
        // public Dictionary<string, MediaStreamTrack> Tracks => m_tracks;

        /// <summary>
        /// 
        /// </summary>
        public bool isPlaying
        {
            get
            {
                if (string.IsNullOrEmpty(Transceiver.Mid))
                    return false;
                if (Transceiver.Sender.Track.ReadyState == TrackState.Ended)
                    return false;
                return true;
            }
        }

        private RTCRtpTransceiver m_transceiver;
        private MediaStreamTrack m_track;

        private Dictionary<string, RTCRtpTransceiver> m_transceivers = new Dictionary<string, RTCRtpTransceiver>();
        public List<MediaStreamTrack> m_tracks = new List<MediaStreamTrack>();
        /// <summary>
        ///
        /// </summary>
        /// <param name="connectionId"></param>
        /// <param name="receiver"></param>
        public virtual void SetTransceiver(string connectionId, RTCRtpTransceiver transceiver)
        {
            if (connectionId == null)
                throw new ArgumentNullException("connectionId", "connectionId is null");

            // if (transceiver == null)
            // {
            //     m_transceivers.Remove(connectionId);
            //     if (!m_transceivers.Any())
            //     {
            //         OnStoppedStream?.Invoke(connectionId);
            //         if (m_tracks.ContainsKey(connectionId))
            //         {
            //             m_tracks[connectionId].Dispose();
            //             m_tracks[connectionId] = null;
            //             m_tracks.Remove(connectionId);
            //         }
            //         m_track.Dispose();
            //         m_track = null;
            //     }
            // }
            // else
            // {
            //     m_transceivers.TryAdd(connectionId, transceiver);
            //     if (m_transceivers.Count() <= 1)
            //     {
            //         OnStartedStream?.Invoke(connectionId);
            //     }
            // }
            m_transceiver = transceiver;
            m_track = m_transceiver?.Receiver.Track;
            if (m_transceiver?.Receiver.Track is VideoStreamTrack)
                m_tracks.Add(m_transceiver?.Receiver.Track);

            m_track = m_tracks[streamIndex];
            
            if (m_transceiver == null)
                OnStoppedStream?.Invoke(connectionId);
            else
                OnStartedStream?.Invoke(connectionId);
        }

        protected virtual void OnDestroy()
        {
            // foreach ((string connectionId, MediaStreamTrack track) in m_tracks)
            // {
            //     track.Dispose();
            //     m_tracks[connectionId] = null;
            // }
            //
            m_track?.Dispose();
            m_track = null;
        }
    }
}
