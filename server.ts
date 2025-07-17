import app from "./src/app";
import { PORT } from "./src/config/env";
import connectToDatabase from "./src/database/mongodb";

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDatabase();
})