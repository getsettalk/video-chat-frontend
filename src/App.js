import React, { useEffect, useState, useRef } from 'react'
import { Button, TextField, IconButton } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PhoneIcon from '@mui/icons-material/Phone';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const socket = io.connect('http://localhost:5000');



const App = () => {
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const [stream, setStream] = useState();
  const [me, setMe] = useState('');
  const [idToCall, setIdToCall] = useState('');
  const [name, setName] = useState('');
  const [caller, setCaller] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        // console.log(`currentStream`, currentStream)
        // console.log(` myVideo.current`, myVideo.current)
        myVideo.current.srcObject = currentStream;
      });

    socket.on('me', (id) => {
      setMe(id);
    });

    socket.on('callUser',(data) => {
      console.log(`line 42 appjs`,data);
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal)
    });
  }, []);


  const callUser = (id) => {
    console.log(`callUser function called id`, id)
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", { // in yt video added callUser
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      })
    });


    peer.on("stream", (stream) => {
      console.log(` line 70 peer stream app.js`,stream)
      // here stream  is differen as like parameter
      // here i'm setting another user video 
      userVideo.current.srcObject = stream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true)
      peer.signal(signal);
    });
    connectionRef.current = peer;
  }
  // new function 
  const answerCall = () => {
    setCallAccepted(true); // i think call ended and set false
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller })
    });

    peer.on('stream', (stream) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    // window.location.reload();
  }


  return (
    <>
      <h1 className='text-center '> ZoomCall</h1>
      <div className="container">
        <div className="video-contnainer">
          <div className="video">
            {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
          </div>
          <div className="video">
            {callAccepted && !callEnded ?
              <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} /> : null}
          </div>
        </div>
      </div>

      {/* for copy id box  */}
      <div className="myId">

        <TextField 
        id='fillled-basic'
        label="Name"
        variant="filled"
        value={name}
        onChange = {(e)=>setName(e.target.value)}
        style ={{marginBottom : "20px"}}
        />

        <CopyToClipboard text={me} style={{marginBottom:"20px"}}>
          <Button variant='contained' color="primary" startIcon={<AssignmentIcon fontSize='large'/>}>
            Copy ID
          </Button>
        </CopyToClipboard>


        <TextField 
        id='fillled-basic'
        label="Id to Call"
        variant="filled"
        value={idToCall}
        onChange = {(e)=>setIdToCall(e.target.value)}
        style ={{marginBottom : "20px"}}
        />

        <div className="call-button">
          {
            callAccepted &&  !callEnded ?
          (  <Button variant='contained' color='secondary' onClick={leaveCall}>
              End Call
            </Button> ) : 
            (
              <IconButton color='primary' aria-label='call' onClick={()=>callUser(idToCall)}>
                <PhoneIcon fontSize='large' />
              </IconButton>
            )
          }
          {idToCall}
        </div>
        <div>
          {
            receivingCall && !callAccepted ? (
              <div className="caller">
                <h1>{name} is calling...</h1>
                <Button variant='contained' color='secondary' onClick={answerCall}>
              Answer
            </Button>
              </div>
            ) : null
          }
        </div>
      </div>
    </>
  )
}

export default App