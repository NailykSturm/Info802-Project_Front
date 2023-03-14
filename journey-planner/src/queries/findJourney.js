import axios from 'axios';

import { useMapStore } from '../stores/mapStore';
import { useJourneyStore } from '../stores/journeyStore';
import { MAP_API_KEY } from '../env';

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
        getRoadJourney().then((journey) => {
            mapStore.geojson = journey;
            journeyStore.calcJourneyPersentage = 50;
            getStopPoints(journey).then((stopPoints) => {
                console.log(stopPoints);
                journeyStore.calcJourneyPersentage = 100;
                resolve();
            }).catch((err) => {
                reject(err);
            });
            resolve();
        }).catch((err) => {
            reject(err);
        });
    });
}

function getRoadJourney(){
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

function getStopPoints(journey) {
    const journeyStore = useJourneyStore();
    const car = journeyStore.car;
    return new Promise((resolve, reject) => {
        // TODO
        resolve();
    });
}