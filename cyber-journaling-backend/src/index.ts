import express from 'express';
import cors from 'cors';
import configDataRoute from './routes/config-data-route';
import dataRoute from "./routes/data-route";

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/configData', configDataRoute)
app.use('/case', dataRoute)

app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
