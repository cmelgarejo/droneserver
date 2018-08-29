# Drone server (+ simulated drones)

POC project on how to manage a small drone fleet getting their GPS positions, also able to extend with command queueing, using mqtt as message broker along with protobuf for serialization, express and pugjs to serve a simple dashboard/page to look at all drones and also an endpoint for filter said drones with `/{groupId}`

MQTT + Protobuf = :heart:

## Protocol

[MQTT.org](https://mqtt.org/)

![MQTT stack](https://www.hivemq.com/wp-content/uploads/mqtt-tcp-ip-stack.png)

```text
The MQTT connection is always between one client and the broker. Clients never connect to each other directly. To initiate a connection, the client sends a CONNECT message to the broker. The broker responds with a CONNACK message and a status code. Once the connection is established, the broker keeps it open until the client sends a disconnect command or the connection breaks.
```

[Source: MQTT Essentials](https://www.hivemq.com/blog/mqtt-essentials-part-3-client-broker-connection-establishment)

MQTT is pretty useful to avoid he use of unnecesary websockets and sockets around the containers, no need to mantain the sockets up, or having the HTTP overhead on each request when you need to send messages over.

It can be implemented in almost all programming languages and those that can be embedded in small hardware like Raspberry PIs or even an Arduino with a GPS shield for this use case.

That's ok, but instead of passing string messages whats the best way to improve the size of he payload? There's a nice OSS project called Protobuf

## Serialization: Protobuf

```text
Protocol Buffers are a language-neutral, platform-neutral, extensible way of serializing structured data for use in communications protocols, data storage, and more, originally designed at Google
```

[Source: ProtoBuf.js](https://github.com/dcodeIO/ProtoBuf.js/)

The message is serialized and encoded as a buffer stream of bytes and so we can send the messages with the lowest amount of byte transfer, and there's less expenses on our cellular connection :+1:

## Assumptions

- Drones have a Raspberry PI, Arduino, or even a cellphone attach to them so we can program a MQTT client that can resport to the broker.
- Drones are to report every 1 to 10 seconds, no need to check that other than the timestamp of the position they are sending (that info can be obtained even from the NMEA format of the barebones API of the GPS)
- Accuracy is actually around 5m on most civil GPS, so checking for 1m can lead to false "positives"

## About storage logic

- To hold up the information, just check the sum deltaT from the last recorded position (curPos.time - oldPos.time) and there is a difference in the distance between positions

## Build and Run the container

### Build the image

`docker build -t dronegps .`

### And then run the image

`docker run -p 3000:3000 -t dronegps`

## Run drone simulation

`node drones [DRONE_COUNT]`

Initializes the a MQTT client and an array of reporting drones that will report every 3 seconds to the MQTT broker.

Group

- id
- description

Drone

- id
- groupId (1:1)
- Pos

Assumptions:

- if a drone doesn't belong to any group should autoassign one
- how many groups do he server has? one group, do groups have limits? should at last have 3

groups: [ {
id, ...whatever
} ]

groupDrone: [{
droneId, groupId
}]

drone: [
{
id, position
}
]
