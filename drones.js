const uuid = require('uuid/v4')
const { loadSync } = require('protobufjs')
const { connect } = require('mqtt')
const client = connect('mqtt://test.mosquitto.org')

const SERVER_TOPIC = '/drone/server'
const MESSAGE_INTERVAL = 3 * 1000
// grab the thrid arg
const DRONES_NUMBER = Number(process.argv[2] || 10)

const DronePosition = loadSync('drone.proto').lookupType('Drone.Position')

const generateDroneName = () => uuid()
const randomLatLon = () => (Math.random() * (-180 - 180) + 180).toFixed(5) * 1
const randomInt = () => Math.floor(Math.random() * (0, 100)) // For speed/altitude mocks

const moveDrone = drone => {
  const r = 5 / 111300 // There are 111300 meters in a degree, so to move just 5m around
  const w = r * Math.sqrt(Math.random())
  const t = 2 * Math.PI * Math.random()
  let x = w * Math.cos(t)
  let y = w * Math.sin(t)
  x = x / Math.cos(drone.lon)
  // Return a new position, altitude and speed
  return {
    ...drone,
    lat: drone.lat + x,
    lon: drone.lon + y,
    spd: randomInt(),
    alt: randomInt(),
    ts: new Date().getTime()
  }
}

// Initialize the drones with a random position, speed and altitude
let drones = (() => {
  let ds = []
  do {
    ds.push({
      id: generateDroneName(),
      lat: randomLatLon(),
      lon: randomLatLon(),
      spd: randomInt(),
      alt: randomInt()
    })
  } while (ds.length < DRONES_NUMBER)
  return ds
})()

const sendMessage = () => {
  for (let i = 0; i < drones.length; i++) {
    // 50/50 chance for the drone to just stay still
    if (Math.random() > 0.5)
      // Or else, move it
      drones[i] = moveDrone(drones[i])

    const bMsg = DronePosition.create({
      ...drones[i] // Spread operator fits the data into the the creation of the protobuf msg
    })
    client.publish(SERVER_TOPIC, DronePosition.encode(bMsg).finish())
  }
}

const fnSusbcribe = (err, granted) => {
  if (err) console.error('Could not connect to mqtt broker. Error: ', err)
  console.info('Subscribed to: ', granted)
  setInterval(sendMessage, MESSAGE_INTERVAL)
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
