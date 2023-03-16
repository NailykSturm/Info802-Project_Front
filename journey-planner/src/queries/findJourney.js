import axios from 'axios';
import { storeToRefs } from 'pinia';

import { useMapStore } from '../stores/mapStore';
import { useJourneyStore } from '../stores/journeyStore';
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
    * ? 1. Call the SOAP API to get coordonates of all point of stop
    * ?   - INPUT : 
    * ?       * journey : GeoJSON from openrouteservice API
    * ?       * car : JSON from chargepoint API
    * ?   - OUTPUT :
    * ?       * stopPoints : Array of coordonates
    * // 2. Call the chargetrip API to get the station near the stopPoints
    * //  - INPUT :
    * //      * stopPoints : Array of coordonates
    * //  - OUTPUT :
    * //       * stations : Array of station
    * // 3. Call the openrouteservice API to get the travel between each stopPoints
    * //   - INPUT :
    * //       * stopPoints : Array of station
    * //   - OUTPUT :
    * //       * journey : Array of GeoJSON
    * // 4. Display the journey on the map
    * // 4. (async) Call the SOAP API to get the time of the entire journey
    * //   - INPUT :
    * //       * journey : GeoJSON
    * //       * car : JSON from chargepoint API
    * //       * stations : Array of station
    * //   - OUTPUT :
    * //       * allTime : Number
    * //       * detailedTime : Array of Number, corresponding to the time between each stopPoints + the time to charge the car
    * // 5. Display the time on the UI + the time of each stopPoints
    */
    const mapStore = useMapStore();
    const journeyStore = useJourneyStore();
    return new Promise((resolve, reject) => {
        journeyStore.calcJourneyPersentage = 0;
        getRoadJourney().then((journey) => {    // ! 0
            mapStore.geojson = journey;
            console.log(journey);
            journeyStore.calcJourneyPersentage = 20;
            getStopPoints(journey).then((stopPoints) => {   // ? 1
                console.log(stopPoints);
                journeyStore.calcJourneyPersentage = 40;
                // TODO : Do some data treatment
                getStations(stopPoints).then((stations) => {    // // 2
                    console.log(stations);
                    journeyStore.calcJourneyPersentage = 60;
                    // TODO : Do some data treatment
                    getRoadJourney().then((journey) => {    // // 3
                        console.log(journey);
                        // TODO : Do some data treatment
                        mapStore.geojson = journey;
                        journeyStore.calcJourneyPersentage = 80;
                        getTimeTravel(journey, stations).then((allTime) => {    // // 4
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
    });
}

/**
 * Call the openrouteservice API to get a journey between all step defined by the user and the stopPoints
 * @returns GeoJSON of the journey
 */
function getRoadJourney() {
    const journey = useJourneyStore();
    return new Promise((resolve, reject) => {
        var coordinates = [];
        journey.journey.forEach((step) => {
            if (step.location != null && step.location != '') {
                if (step.coord.length > 0) {
                    coordinates.push([step.coord[0], step.coord[1]]);
                } else {
                    reject(`Vous avez choisis ${step.location} comme ville pour l'étape ${step.step == 'start' ? 'de départ' : step.step == 'end' ? 'd\'arrivée' : 'n°' + step.step + '/' + journey.journey.value.length}. `
                        + `Lorsque vous choisissez une ville, veillez à bien selectionner la ville que vous souhaitez dans la liste déroulante`);
                }
            }
        });
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
        let part = {
            "distance": 0,
            "duration": 0,
            "steps": [],
            "way_points": [0, 0],
        };
        feature.properties.segments.forEach(segment => {
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
        })
        coords.push(feature.geometry.coordinates);
        segments.push(part);
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

        for(const segment in segments) {
            for(const step in segment) {
                if(distanceFromLastStop + step.distance >= (car.range.worst.combined * 100)) {
                    console.log(`Stop point added at ${coords[step.way_points[0]]} for a distance of ${distanceFromLastStop} m`);
                    stopPoints.push(coords[step.way_points[0]]);
                    distanceFromLastStop = 0;
                }
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
        // TODO
        resolve();
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
    const car = journeyStore.car;

    return new Promise((resolve, reject) => {
        // TODO
        resolve();
    });
}