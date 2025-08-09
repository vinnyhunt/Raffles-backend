
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res)=>res.json({ok:true}));
app.listen(Number(process.env.PORT||4000), ()=>console.log('API up'));
