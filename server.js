const protobufjs = require('protobufjs')
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')
const SERVER_TOPIC = '/drone/server'
const CLIENT_TOPIC = '/drone/client/+'
let DRONE_DB = []

const DronePosition = protobufjs
  .loadSync('drone.proto')
  .lookupType('Drone.Position')

/* ======================= Function expressions ========================== */
const fnSusbcribe = (err, granted) =>
  err
    ? console.error('Could not connect to mqtt broker. Error: ', err)
    : console.info('Subscribed to: ', granted)

const droneCommands = msg => {
  client.publish('/drone/client', `${droneName}: gps position!`)
}

const fnDroneClientCommands = (err, granted) => {
  fnSusbcribe(err, granted)
}
const fnOffline = () => {
  console.info('Offline, cannot reach broker')
  // Trying to reconnect if it's offline, is it a good practice?
  client.reconnect()
}

const subscriptions = () => {
  client.subscribe(SERVER_TOPIC, fnSusbcribe)
  client.subscribe(CLIENT_TOPIC, fnSusbcribe)
}

/* ======================== MQTT "server" code =========================== */

client.on('connect', subscriptions)

client.on('offline', fnOffline)

client.on('message', function(topic, payload) {
  switch (topic) {
    case SERVER_TOPIC:
      const dronePosition = DronePosition.decode(payload)
      DRONE_DB = DRONE_DB.filter(d => d.id !== dronePosition.id)
      DRONE_DB.push(dronePosition)
      console.log(DRONE_DB)
      break
    case CLIENT_TOPIC:
    default:
      console.log(`${topic}: ${payload}`)
  }
})
