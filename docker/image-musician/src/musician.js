//import { argv } from 'process';
const { v4: uuidv4 } = require('uuid');

// We use a standard Node.js module to work with UDP
const  dgram = require('dgram');

var uuid = uuidv4();

const ADDRESSE_MULTICAST = "239.255.22.5";
const PORT = 2205;

const instrumentMap = new Map([
		["piano", "ti-ta-ti"], 
        ["trumpet", "pouet"], 
        ["flute", "trulu"], 
        ["violin", "gzi-gzi"], 
        ["drum", "boum-boum"]])

const s = dgram.createSocket('udp4');
console.log(process.argv);

// Create a measure object and serialize it to JSON
var musician = { uuid : uuid,
				 instrument : instrumentMap.get(process.argv[2])
			   };

console.log(musician);

var payload = JSON.stringify(musician);
// Send the payload via UDP (multicast)

message = new Buffer(payload);

function send(){
	s.send(message, 0, message.length, PORT, ADDRESSE_MULTICAST,
	function(err, bytes) {
	console.log("Sending payload: " + payload + " via port " + s.address().port);
	});
};

setInterval(send, 1000);