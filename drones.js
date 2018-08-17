const protobufjs = require('protobufjs')
const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://test.mosquitto.org')

const SERVER_TOPIC = '/drone/server'

const droneName = 'Drone1534531026799' //'Drone' + Number(new Date())

const DronePosition = protobufjs
  .loadSync('drone.proto')
  .lookupType('Drone.Position')

const sendMessage = () => {
  const bMsg = DronePosition.create({
    id: droneName,
    lat: -1,
    lon: -1,
    spd: 0,
    alt: 0
  })
  client.publish(SERVER_TOPIC, DronePosition.encode(bMsg).finish())
}

const fnSusbcribe = (err, granted) => {
  if (err) console.error('Could not connect to mqtt broker. Error: ', err)
  console.info('Subscribed to: ', granted)
  sendMessage()
}

const fnOffline = () => {
  console.info('Offline, cannot reach broker')
  client.end()
}

const subscriptions = () => {
  client.subscribe(SERVER_TOPIC, fnSusbcribe)
}

client.on('connect', subscriptions)

client.on('offline', fnOffline)
