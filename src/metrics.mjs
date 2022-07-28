import { diffKeys, metricKeys } from "./constants.mjs";

import fastify from "fastify";
import got from "got";
import moment from "moment";
import { tranformData } from "./reports.mjs";

const vehicles = ["990", "991", "1089", "1090", "1200", "1239"];
const uri = "https://pegasus239.peginstances.com/api/rawdata";
const fields =
  "ecu_ev_motor_current,ecu_ev_motor_voltage,ecu_state_of_charge,ecu_dist,dev_ign,dev_idle,ecu_tfuel";

export const makeMetrics = async () => {
  let records = [];
  const now = new moment().format("YYYY-MM-DD[T]HH:mm:ss");
  const weekAgo = new moment().subtract(7, "d").format("YYYY-MM-DD[T]00:00:00");
  const response = await got
    .get(
      `${uri}?vehicles=${vehicles.join(
        ","
      )}&fields=${fields}&from=${weekAgo}&to=${now}&auth=${process.env.AUTH}`
    )
    .json();

  for (const vehicle of vehicles) {
    for (let i = 6; 0 <= i; i--) {
      const dayData = dayDataFromVehicle(vehicle, i, response.events);
      records.push(dayData);
    }
  }
  return records;
};

export const makeMetricsFromDate = async (date) => {
  let records = [];
  const now = new moment(date).format("YYYY-MM-DD[T]HH:mm:ss");
  const weekAgo = new moment(date)
    .subtract(7, "d")
    .format("YYYY-MM-DD[T]00:00:00");

  const response = await got
    .get(
      `${uri}?vehicles=${vehicles.join(
        ","
      )}&fields=${fields}&from=${weekAgo}&to=${now}&auth=${process.env.AUTH}`
    )
    .json();

  for (const vehicle of vehicles) {
    for (let i = 6; 0 <= i; i--) {
      const dayData = dayDataFromVehicle(vehicle, i, response.events, date);
      records.push(tranformData(dayData));
    }
  }
  const orderData = records.sort(
    (a, b) => Number(a.date.split("-")[2]) - Number(b.date.split("-")[2])
  );
  return orderData;
};

const dayDataFromVehicle = (vehicle, dayIndex, data, date) => {
  const day = new moment(date).subtract(dayIndex, "d").format("YYYY-MM-DD");
  console.log(dayIndex);
  console.log(day);
  const dayData = data.filter(
    (d) => d.event_time.includes(day) && `${d.vid}` === vehicle
  );
  const lowestValue = getLowestHighestValueByKeys(
    dayData,
    metricKeys,
    "lowest"
  );
  const highestValue = getLowestHighestValueByKeys(
    dayData,
    metricKeys,
    "highest"
  );
  const averageValue = getAverageValues(dayData, metricKeys);
  const diffValues = getDiffFistLastValueOfDay(dayData, diffKeys);
  return {
    date: day,
    vehicle: vehicle,
    lowest: lowestValue,
    highest: highestValue,
    average: averageValue,
    diff: diffValues,
  };
};

const getAverageValues = (array, keys) => {
  let averageValues = {};
  for (const key of keys) {
    let sum = 0;
    let count = 0;
    for (const item of array) {
      sum += item[key];
      count++;
    }
    averageValues[key] = sum / count;
  }
  return averageValues;
};

const getLowestHighestValueByKeys = (array, keys, type) => {
  let bestValues = {};
  for (const key of keys) {
    let bestValue = array[0];
    for (const item of array) {
      if (
        (type === "lowest" && item[key] < bestValue[key]) ||
        (type === "highest" && item[key] > bestValue[key])
      ) {
        bestValue = item;
      }
    }
    bestValues[key] =
      bestValue && bestValue[key] !== null ? bestValue[key] : "NaN";
  }
  return bestValues;
};

const getDiffFistLastValueOfDay = (array, keys) => {
  const sortDay = sortValueOfDay(array, "event_time");
  const { first, last } = getFirstLastValueOfDay(sortDay);
  let diffValues = {};

  for (const key of keys) {
    if (first && last && first[key] && last[key]) {
      calculateDifference(first[key], last[key]);
      diffValues[key] = calculateDifference(first[key], last[key]);
    } else {
      diffValues[key] = "NaN";
    }
  }

  return diffValues;
};

const sortValueOfDay = (array, key) => {
  return array.sort((a, b) => a[key] - b[key]);
};

const getFirstLastValueOfDay = (array) => {
  let first = array[0];
  let last = array[array.length - 1];
  return { first, last };
};

const calculateDifference = (first, last) => {
  return first > last ? first - last : last - first;
};
