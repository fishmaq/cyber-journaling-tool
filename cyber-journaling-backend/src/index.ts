import express from 'express';
import cors from 'cors';
import configDataRoute from './routes/config-data-route';
import caseRoute from "./routes/case-route";
import eventRoute from "./routes/event-route";
import serviceRoute from "./routes/service-route";
import netplanRoute from "./routes/netplan-route";

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/configData', configDataRoute)
app.use('/api/case', caseRoute)
app.use('/api/event', eventRoute)
app.use('/api/service', serviceRoute)
app.use('/api/netplan', netplanRoute)

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
