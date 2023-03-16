import qql from 'graphql-tag';

export const carQuery = qql`
query vehicleList($page: Int, $size: Int, $search: String) {
    vehicleList(
        page: $page, 
        size: $size, 
        search: $search, 
    ) {
    id
    naming {
        make
        model
        chargetrip_version
    }
    media {
        image {
            thumbnail_url
        }
    }
    battery {
        usable_kwh
    }
    routing {
      fast_charging_support
    }
    }
}
`;
export const getCarDetailsQuery = qql`
query vehicle($vehicleId: ID!) {
  vehicle(id: $vehicleId) {
    naming {
      make
      model
      chargetrip_version
    }
    media {
      image {
        url
      }
      brand {
        thumbnail_url
      }
    }
    battery {
      usable_kwh
    }
    range {
      best {
        highway
        city
        combined
      }
      worst {
        highway
        city
        combined
      }
      chargetrip_range {
        best
        worst
      }
    }
    routing {
      fast_charging_support
    }
    connectors {
      standard
    }
    performance {
      acceleration
      top_speed
    }
  }
}
`;

export const stationsQuery = qql`
query stationAround($query: StationAroundQuery!){
stationAround(
  query:$query,
  size: 1
  page: 0
  ) {
    id
    location {
      type
      coordinates
    }
    status
    speed
  }
}
`;