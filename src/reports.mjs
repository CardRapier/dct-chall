import { diffKeys, metricKeys } from "./constants.mjs";

import { createObjectCsvWriter as createCsvWriter } from "csv-writer";
import { makeMetrics } from "./metrics.mjs";

export const showData = async () => {
  const csvWriter = createCsvWriter({
    path: "file.csv",
    header: prepareHeader(),
  });
  //{date: day, vehicle: vehicle, lowest: lowestValue, highest: highestValue, average: averageValue, diff: diffValues}
  const data = await makeMetrics();
  const dataToShow = data.map((d) => tranformData(d));
  const orderData = dataToShow.sort((a, b) => Number(a.date.split('-')[2]) - Number(b.date.split('-')[2]));
  await csvWriter.writeRecords(orderData);
};

const prepareHeader = () => {
  let header = [
    { id: "date", title: "Date" },
    { id: "vehicle", title: "Vehicle" },
  ];
  const lowest = prepareHeaderWithKeys(metricKeys, "lowest");
  const highest = prepareHeaderWithKeys(metricKeys, "highest");
  const average = prepareHeaderWithKeys(metricKeys, "average");
  const diff = prepareHeaderWithKeys(diffKeys, "diff");
  header.push(...lowest, ...highest, ...average, ...diff);
  return header;
};

const prepareHeaderWithKeys = (keys, prefix) => {
  let header = [];
  for (const key of keys) {
    let title = prefix ? `${prefix}_${key}` : key;
    header.push({ id: title, title: title });
  }
  return header;
};

export const tranformData = (data) => {
  let result = {};
  let keys = Object.keys(data);
  for (const key of keys) {
    if (typeof data[key] !== "object") {
      result[key] = data[key];
    } else {
      let objectKeys = Object.keys(data[key]);
      for (const objectKey of objectKeys) {
        result[`${key}_${objectKey}`] = data[key][objectKey];
      }
    }
  }
  return result;
};
