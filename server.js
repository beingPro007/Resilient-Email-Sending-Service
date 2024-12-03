import express from 'express';
const app = express();

const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
