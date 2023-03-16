import axios from 'axios';
import { request, GraphQLClient } from 'graphql-request';

import { useMapStore } from '../stores/mapStore';
import { useJourneyStore } from '../stores/journeyStore';
import { CHARGETRIP_API_HEADERS } from '../env';
import { stationsQuery } from './queries'
import { MAP_API_KEY, SOAP_API_URL } from '../env';

const soapRequestHeaders = {
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': ' text/xml; charset=utf-8',
    'SOAPAction': 'ping',
    'Content-Length': 'Infinity',
    'Host': '127.0.0.1:8000',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Accept': 'text/xml',
};

export const pingSOAP = () => {
    const xml = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:spy="spyne.usmb.journey.planner.soap">
    <soapenv:Header/>
    <soapenv:Body>
        <spy:ping/>
    </soapenv:Body>
 </soapenv:Envelope>
    `;

    // return new Promise((resolve, reject) => {
    //     axios({
    //         method: 'post',
    //         url: SOAP_API_URL,
    //         data: xml,
    //         headers: soapRequestHeaders
    //     })
    //         .then((response) => {
    //             resolve(response);
    //         }).catch((err) => {
    //             reject(err);
    //         });
    // });

    // let xhr = new XMLHttpRequest();
    // xhr.open("POST", SOAP_API_URL);
    // xhr.withCredentials = false;
    // xhr.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
    // xhr.setRequestHeader("SOAPAction", "{spyne.usmb.journey.planner.soap}ping");
    // xhr.setRequestHeader("Accept", "text/xml");
    // xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
    // xhr.setRequestHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    // xhr.setRequestHeader("Access-Control-Allow-Headers", "*");

    // return new Promise((resolve, reject) => {
    //     xhr.send(xml);
    //     xhr.onload = function () {
    //         if (xhr.status != 200) { // analyze HTTP status of the response
    //             reject(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
    //         } else { // show the result
    //             resolve(`Done, got ${xhr.response.length} bytes`); // response is the server response
    //         }
    //     };

    //     xhr.onprogress = function (event) {
    //         if (event.lengthComputable) {
    //             alert(`Received ${event.loaded} of ${event.total} bytes`);
    //         } else {
    //             alert(`Received ${event.loaded} bytes`); // no Content-Length
    //         }

    //     };

    //     xhr.onerror = function () {
    //         reject("Request failed");
    //     };
    // });
}

export const getJourney = () => {
    /**
    ** ALGO : multi request to complete the journey plannification 
    ** Explanation of the notes marks :
    * ! : Done 
    * ? : WIP
    * // : Not done
    * 
    ** Explanation of the steps :
    * ! 0. Call the openrouteservice API to get a journey between the start and the end
    * !   - INPUT :
    * !       * coordonates : Array of coordonates (start -> end possibly with some other point between)
    * !   - OUTPUT :
    * !       * journey : GeoJSON
    * ! 1. Call the SOAP API to get coordonates of all point of stop
    * !   - INPUT : 
    * !       * journey : GeoJSON from openrouteservice API
    * !       * car : JSON from chargepoint API
    * !   - OUTPUT :
    * !       * stopPoints : Array of coordonates
    * ! 2. Call the chargetrip API to get the station near the stopPoints
    * !  - INPUT :
    * !      * stopPoints : Array of coordonates
    * !  - OUTPUT :
    * !       * stations : Array of station
    * ! 3. Call the openrouteservice API to get the travel between each stopPoints
    * !   - INPUT :
    * !       * stopPoints : Array of station
    * !   - OUTPUT :
    * !       * journey : Array of GeoJSON
    * ! 4. Display the journey on the map
    * ! 4. (async) Call the SOAP API to get the time of the entire journey
    * !   - INPUT :
    * !       * journey : GeoJSON
    * !       * car : JSON from chargepoint API
    * !       * stations : Array of station
    * !   - OUTPUT :
    * !       * allTime : Number
    * !       * detailedTime : Array of Number, corresponding to the time between each stopPoints + the time to charge the car
    * // 5. Display the time on the UI + the time of each stopPoints
    */
    const mapStore = useMapStore();
    const journeyStore = useJourneyStore();
    journeyStore.calcJourneyPersentage = 0;
    return new Promise((resolve, reject) => {
        if (journeyStore.car == null) {
            reject("Veuillez sélectionner une voiture !");
        } else {
            var coordinates = [];
            journeyStore.journey.forEach((step) => {
                if (step.location != null && step.location != '') {
                    if (step.coord.length > 0) {
                        coordinates.push([step.coord[0], step.coord[1]]);
                    } else {
                        reject(`Vous avez choisis ${step.location} comme ville pour l'étape ${step.step == 'start' ? 'de départ' : step.step == 'end' ? 'd\'arrivée' : 'n°' + step.step + '/' + journeyStore.journey.length}. `
                            + `Lorsque vous choisissez une ville, veillez à bien selectionner la ville que vous souhaitez dans la liste déroulante`);
                    }
                }
            });
            getRoadJourney(coordinates).then((journey) => {    // ! 0
                mapStore.geojson = journey;
                // console.log(journey);
                journeyStore.calcJourneyPersentage = 20;
                getStopPoints(journey).then((stopPoints) => {   // ! 1
                    // console.log(stopPoints);
                    journeyStore.calcJourneyPersentage = 40;
                    if (stopPoints == []) {
                        resolve("Pas d'arrêt pour recharger les batteries")
                        journeyStore.calcJourneyPersentage = 100;
                    }
                    getStations(stopPoints).then((stations) => {    // ! 2
                        journeyStore.calcJourneyPersentage = 60;

                        let coordinatesWithStations = [];
                        for (let i = 0; i < journeyStore.journey.length; i++) {
                            coordinatesWithStations.push([journeyStore.journey[i].coord[0], journeyStore.journey[i].coord[1]]);
                            if (i < journeyStore.journey.length - 1) {
                                for (let j = 0; j < stations[i].length - 1; j++) {
                                    coordinatesWithStations.push([stations[i][j].coordinates[0], stations[i][j].coordinates[1]]);
                                }
                            }
                        }
                        console.log(coordinatesWithStations);
                        getRoadJourney(coordinatesWithStations).then((journey) => {    // ! 3
                            console.log(journey);
                            mapStore.geojson = journey;
                            journeyStore.calcJourneyPersentage = 80;

                            getTimeTravel(journey, stations).then((allTime) => {    // ! 4
                                console.log(allTime);
                                journeyStore.calcJourneyPersentage = 100;
                                // TODO : Do some data treatment
                                resolve();
                            });
                        });
                    });
                });
            }).catch((err) => {
                console.error(err);
                reject(err);
            });
        }
    });
}

/**
 * Call the openrouteservice API to get a journey between all step defined by the user and the stopPoints
 * @returns GeoJSON of the journey
 */
function getRoadJourney(coordinates) {
    return new Promise((resolve, reject) => {
        if (coordinates.length < 2) {
            reject("Vous ne pouvez pas plannifier un trajet avec moins de deux points de passage");
        } else {
            axios.post(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
                "coordinates": coordinates,
            }, {
                headers: {
                    Authorization: MAP_API_KEY,
                }
            }).then((data) => {
                console.log(data);
                var travelGeoJSON = data.data;
                resolve(travelGeoJSON);
            }).catch((err) => {
                console.log(err);
                reject(err.response.data.error.message);
            })
        }
    });
}

/**
 * Call the SOAP API to get the stopPoints of the journey
 * @param {GeoJSON} journey GeoJSON of the journey
 * @returns stopPoints => Array of coordonates
 */
function getStopPoints(journey) {
    const journeyStore = useJourneyStore();

    let coords = [];
    let segments = [];
    journey.features.forEach(feature => {
        feature.properties.segments.forEach(segment => {
            let part = {
                "distance": 0,
                "duration": 0,
                "steps": [],
                "way_points": [0, 0],
            };
            part.distance = segment.distance;
            part.duration = segment.duration;
            segment.steps.forEach(step => {
                part.steps.push({
                    "distance": step.distance,
                    "duration": step.duration,
                    "way_points": step.way_points,
                })
            })
            part.way_points[0] = segment.steps[0].way_points[0];
            part.way_points[1] = segment.steps[segment.steps.length - 1].way_points[1];
            segments.push(part);
        })
        coords.push(feature.geometry.coordinates);
    });
    const geojson = {
        "coordinates": coords,
        "segments": segments,
    };

    const userCar = journeyStore.car;
    let car = {
        "battery": userCar.battery.usable_kwh,
        "routing": {
            "fast_charging_support": userCar.routing.fast_charging_support,
        },
        "range": {
            "best": {
                "city": userCar.range.best.city,
                "highway": userCar.range.best.highway,
                "combined": userCar.range.best.combined,
            },
            "worst": {
                "city": userCar.range.worst.city,
                "highway": userCar.range.worst.highway,
                "combined": userCar.range.worst.combined,
            },
            "chargetrip_range": {
                "best": userCar.range.chargetrip_range.best,
                "worst": userCar.range.chargetrip_range.worst,
            },
        }
    }

    // TODO : Replace the front data treatment by SOAP API call
    return new Promise((resolve, reject) => {
        const coords = geojson.coordinates;
        const segments = geojson.segments;
        let stopPoints = [];
        let distanceFromLastStop = 0;

        for (const i in segments) {
            const segment = segments[i];
            stopPoints.push([]);
            for (const step of segment.steps) {
                if (distanceFromLastStop + step.distance >= (car.range.chargetrip_range.worst * 100)) {
                    // console.log(`Stop point added at ${coords[0][step.way_points[0]]} for a distance of ${distanceFromLastStop} m`);
                    stopPoints[i].push(coords[0][step.way_points[0]]);
                    distanceFromLastStop = 0;
                }
                distanceFromLastStop = distanceFromLastStop + step.distance;
            }
        }
        resolve(stopPoints);
    });
}

/**
 * Call the chargetrip API to get the stations near the stopPoints
 * @param {Array} stopPoints 
 * @returns stations => Array of coordonates (each coordonates correspond to the station near the stopPoint)
 */
function getStations(stopPoints) {
    return new Promise((resolve, reject) => {
        let listStations = [];
        const graphQLClient = new GraphQLClient('https://api.chargetrip.io/graphql', {
            headers: CHARGETRIP_API_HEADERS,
        });

        for (let i = 0; i < stopPoints.length; i++) {
            listStations.push([]);
            for (let j = 0; j < stopPoints[i].length; j++) {
                const stopPoint = stopPoints[i][j];
                graphQLClient.request(stationsQuery, { query: { location: { type: "Point", coordinates: stopPoint }, distance: 3000 } })
                    .then(data => {
                        listStations[i].push({
                            "coordinates": data.stationAround[0].location.coordinates,
                            "speed": data.stationAround[0].speed,
                        })
                        if (i >= stopPoints.length - 1 && j >= stopPoints[i].length - 1) {
                            resolve(listStations);
                        }
                    }).catch(err => {
                        console.error(err);
                        reject(err);
                    })
            }
        }
    });
}

/**
 * Call the SOAP API to get the time of the entire journey
 * @param {GeoJSON} journey 
 * @param {Array} stations 
 * @returns Time + Detailed time of the journey
 */
function getTimeTravel(journey, stations) {
    const journeyStore = useJourneyStore();

    let coords = [];
    let segments = [];
    journey.features.forEach(feature => {
        feature.properties.segments.forEach(segment => {
            let part = {
                "distance": 0,
                "duration": 0,
                "steps": [],
                "way_points": [0, 0],
            };
            part.distance = segment.distance;
            part.duration = segment.duration;
            segment.steps.forEach(step => {
                part.steps.push({
                    "distance": step.distance,
                    "duration": step.duration,
                    "way_points": step.way_points,
                })
            })
            part.way_points[0] = segment.steps[0].way_points[0];
            part.way_points[1] = segment.steps[segment.steps.length - 1].way_points[1];
            segments.push(part);
        })
        coords.push(feature.geometry.coordinates);
    });
    const geojson = {
        "coordinates": coords,
        "segments": segments,
    };

    const userCar = journeyStore.car;
    let car = {
        "battery": userCar.battery.usable_kwh,
        "routing": {
            "fast_charging_support": userCar.routing.fast_charging_support,
        },
        "range": {
            "best": {
                "city": userCar.range.best.city,
                "highway": userCar.range.best.highway,
                "combined": userCar.range.best.combined,
            },
            "worst": {
                "city": userCar.range.worst.city,
                "highway": userCar.range.worst.highway,
                "combined": userCar.range.worst.combined,
            },
            "chargetrip_range": {
                "best": userCar.range.chargetrip_range.best,
                "worst": userCar.range.chargetrip_range.worst,
            },
        }
    }

    // TODO : Replace the front data treatment by SOAP API call
    return new Promise((resolve, reject) => {
        const timeSlow = 7 * 60;
        const timeFast = 60;
        const timeTurbo = 30;
        let finalTime = {
            "totalTime": 0,
            "detailedTime": [],
        }

        segments.forEach((segment) => {
            console.log(segment);
            let rechargeTime = 0;
            stations.forEach(stationStep => {
                const coord = coords[0][segment.way_points[1]];
                console.log(coord);
                let nearStation = null;
                let nearStationDistance = null;
                console.warn(stationStep);
                stationStep.forEach(station => {
                    let dist = Math.sqrt(Math.pow((coord[0] - station.coordinates[0]), 2) + Math.pow((coord[1] - station.coordinates[1]), 2));
                    if(nearStationDistance == null || nearStationDistance > dist) {
                        nearStationDistance = dist;
                        nearStation = station;
                    }
                });

                if(car.routing.fast_charging_support) {
                    if(nearStation.speed == 'turbo'){
                        rechargeTime = timeTurbo;
                    } else if (nearStation.speed == 'fast') {
                        rechargeTime = timeFast;
                    } else if (nearStation.speed == 'slow') {
                        rechargeTime = timeSlow;
                    }
                } else {
                    rechargeTime = timeSlow;
                }

                finalTime.detailedTime.push({
                    "travel": segment.duration,
                    "recharge": rechargeTime,
                });
                finalTime.totalTime += segment.duration + rechargeTime;
            });
        });
        resolve(finalTime);
    });
}