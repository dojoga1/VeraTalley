import { createConfig, http } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'

export const config = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http('https://polygon-amoy.g.alchemy.com/v2/alch_0WCbRZKNxOgUa2QzTXWVx'),
  },
})