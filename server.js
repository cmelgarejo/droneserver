const uuid = require('uuid/v4')
const express = require('express')
const app = express()
const { loadSync } = require('protobufjs')
const { distanceTo, createLocation } = require('geolocation-utils')
const { connect } = require('mqtt')
const mqttClient = connect('mqtt://test.mosquitto.org')
const PORT = 2345
const SERVER_TOPIC = '/drone/server'
// const CLIENT_TOPIC = '/drone/client/+'
let GROUP_DB = []
let GROUPDRONE_DB = []
let DRONE_DB = []

const DronePosition = loadSync('drone.proto').lookupType('Drone.Position')

/* ======================= Function expressions ========================== */
const initGroups = () => {
  for (let i = 0; i < 10; i++) {
    GROUP_DB.push({ id: uuid(), description: `Group ${i}` })
  }
}

const fnSusbcribe = (err, granted) =>
  err
    ? console.error('Could not connect to mqtt broker. Error: ', err)
    : console.info('Subscribed to: ', granted)

// TODO: [feature] send commands to drones
// const droneCommands = msg => {
//   mqttClient.publish('/drone/client', `${droneName}: gps position!`)
// }
// const fnDroneClientCommands = (err, granted) => {
//   fnSusbcribe(err, granted)
// }

const fnOffline = () => {
  console.info('Offline, cannot reach broker')
  // Trying to reconnect if it's offline, is it a good practice?
  mqttClient.reconnect()
}

// Main server subscriptions
const subscriptions = () => {
  mqttClient.subscribe(SERVER_TOPIC, fnSusbcribe)
  // mqttClient.subscribe(CLIENT_TOPIC, fnSusbcribe)
}

/* =========================== MQTT "server" ============================= */
parseLatLon = pos => createLocation(pos.lat, pos.lon, 'LatLon')

initGroups()

mqttClient.on('connect', subscriptions)

mqttClient.on('offline', fnOffline)

mqttClient.on('message', function(topic, payload) {
  switch (topic) {
    case SERVER_TOPIC:
      let dronePos = DronePosition.decode(payload)
      const oldDrone = DRONE_DB.filter(d => d.id === dronePos.id)
      if (oldDrone.length) {
        const drone = oldDrone[0]
        const distance = distanceTo(parseLatLon(drone), parseLatLon(dronePos))
        dronePos = {
          ...dronePos,
          // +- There's 5m accuracy for GPS acually
          dt: distance < 5 ? dronePos.ts - drone.ts + (drone.dt || 0) : 0
        }
      }
      DRONE_DB = DRONE_DB.filter(d => d.id !== dronePos.id)
      if (GROUPDRONE_DB.filter(g => g.droneId === dronePos.id).length < 1)
        GROUPDRONE_DB.push({
          groupId: GROUP_DB[Math.floor(Math.random() * (0, 2))].id,
          droneId: dronePos.id
        })
      DRONE_DB.push(dronePos)
      break
    case CLIENT_TOPIC:
    // In case there's a message for a specific drone, future feature ;)
    default:
      console.info(`${topic}: ${payload}`)
  }
})

/* ============================ Dashboard app ============================ */

app.set('view engine', 'pug')

app.get('/', function(_, res) {
  res.render('dashboard', { drones: DRONE_DB, droneGroup: GROUPDRONE_DB })
})

app.get('/:groupId', function(req, res) {
  res.render('droneFilter', {
    drones: GROUPDRONE_DB.filter(g => g.groupId === req.params.groupId).map(
      fg => DRONE_DB.filter(d => d.id === fg.droneId)[0]
    )
  })
})

app.listen(PORT, function() {
  console.info(`Drone viewer serving on port ${PORT}`)
})
