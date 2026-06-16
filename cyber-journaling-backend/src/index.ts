import express from 'express';
import cors from 'cors';
import configDataRoute from './routes/config-data-route';
import caseRoute from "./routes/case-route";
import eventRoute from "./routes/event-route";
import serviceRoute from "./routes/service-route";
import netplanRoute from "./routes/netplan-route";

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/configData', configDataRoute)
app.use('/case', caseRoute)
app.use('/event', eventRoute)
app.use('/service', serviceRoute)
app.use('/netplan', netplanRoute)

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
