import React from 'react';
import Chat from './Chat';

export default function App(){
  return (
    <div style={{display:'flex', justifyContent:'center', padding:20}}>
      <div style={{width:600, border:'1px solid #ddd', borderRadius:8, padding:16}}>
        <h2>SofAI — Chat</h2>
        <Chat />
      </div>
    </div>
  )
}
