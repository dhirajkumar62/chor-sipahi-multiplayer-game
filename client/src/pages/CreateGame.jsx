import{useState}from'react';
import{useNavigate}from'react-router-dom';
import API from'../services/api';
import Layout from'../components/Layout';
export default function CreateGame(){const[b,setB]=useState(false),go=useNavigate();
    const create=async()=>{setB(true);
        try{let r=await API.post('/game/create');
            go('/lobby/'+r.data.game.gameCode)}finally{setB(false)}};
    return <Layout><div className="card center">
        <h1 className="title">Create a private room</h1>
        <p className="muted">Invite three friends with the code we generate.</p>
        <button disabled={b} onClick={create}>{b?'Creating…':'Create game'}</button>
        </div></Layout>}
