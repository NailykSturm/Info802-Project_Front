<script setup>
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

import Map from './components/Map.vue';
import JourneyForm from './components/JourneyForm.vue';
import JourneyList from './components/JourneyList.vue';
import CarForm from './components/CarForm.vue';
import { CAR_API_ID, CAR_CLIENT_ID } from './env'

const client = new ApolloClient({
  uri: 'https://api.chargetrip.io/graphql',
  headers: {
    'x-client-id': CAR_CLIENT_ID,
    'x-api-id': CAR_API_ID,
  },
  cache: new InMemoryCache(),
});

client.query({
  query: qql`
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
  }
}
`
}).then((result) => console.log(result))
  .catch((error) => console.log(error));

</script>

<template>
  <main>
    <n-message-provider>
      <ApolloProvider :client=client>
        <CarForm />
        <div class="flex">
          <div class="map">
            <Map />
          </div>
          <n-space vertical class="forms">
            <JourneyForm />
            <JourneyList />
          </n-space>
        </div>
      </ApolloProvider>
    </n-message-provider>
  </main>
</template>

<style scoped>
.flex {
  display: flex;
  flex-direction: row;
}
.map {
  /* width: 70%; */
  padding-right: 1%;
}
.forms {
  width: 30%;
}
</style>