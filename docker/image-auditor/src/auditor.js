// We use a standard Node.js module to work with UDP
const dgram = require('dgram');

const moment = require('moment');

// Let's create a datagram socket. We will use it to listen for datagrams published in the
// multicast group by thermometers and containing measures
const s = dgram.createSocket('udp4');

const PORT = 2205;
const MULTICAST_ADDRESS = "239.255.22.5";

s.bind(PORT, function() {
	console.log("Joining multicast group");
	s.addMembership(MULTICAST_ADDRESS);
});

const instruments = new Map([ 
        ["ti-ta-ti", "piano"], 
        ["pouet", "trumpet"], 
        ["trulu", "flute"], 
        ["gzi-gzi", "violin"], 
        ["boum-boum", "drum"]])

let musicians = [];

// This call back is invoked when a new datagram has arrived.
s.on('message', function(msg, source) {
	console.log("Data has arrived: " + msg + ". Source IP: " + source.address + ". Source port: " + source.port);
	msg = JSON.parse(msg);
	addUpdateMusician(msg);
});

function addUpdateMusician(data){
	console.log(data);
	let isNewMusician = true;
	for(let i = 0; i < musicians.length; i++){
		if(musicians[i].uuid == data.uuid){
			musicians[i].lastCall= moment();
			isNewMusician = false;
		}
	}
	if(isNewMusician){
		musicians.push({uuid: data.uuid, instrument: instruments.get(data.instrument), activeSince: moment(), lastCall: moment()});
		console.log(musicians);
	}
}

function checkMusiciansAlive(){	
	let delId = [];
	for(let i = 0; i < musicians.length; i++){
		let check = moment(musicians[i].lastCall.format())
		check.add(5, 'seconds')
		if(check.isBefore(moment())){
			delId.push(i);
		}
	}
	
	for(let i = 0; i < delId.length; i++){
		musicians.splice(delId[i], 1);
	}
	console.log("checkMusiciansAlive", delId, musicians);
	setTimeout(checkMusiciansAlive, 1000);
}

var express = require('express');
var app = express();

app.get('/', function(req, res){
	res.send(musicians);
});

app.listen(PORT, function(){
});

checkMusiciansAlive();