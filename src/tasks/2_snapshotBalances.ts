// import { task } from "hardhat/config";

// task("snapshot:balances", "")
//   .addOptionalParam(
//     "start",
//     "distribution start date",
//     DISTRIBUTION_INCEPTION_DATE,
//     types.string,
//   )
//   .setAction(async (_taskArgs, hre) => {

//     const blocks =

//   });

// function loadBlocks(){
//   const file = filePath();

//   return fs.existsSync(file)
//     ? (JSON.parse(fs.readFileSync(file, "utf8")) as Schedule)
//     : {};
// }

// function loadSchedule(): Schedule {
//   const file = filePath();

//   return fs.existsSync(file)
//     ? (JSON.parse(fs.readFileSync(file, "utf8")) as Schedule)
//     : {};
// }

// function writeSchedule(schedule: Schedule) {
//   fs.writeFileSync(filePath(), JSON.stringify(schedule, null, 2), "utf8");
// }

function filePath() {
  return path.resolve(
    path.join(__dirname, "..", "..", "harvest", "schedule.json"),
  );
}
