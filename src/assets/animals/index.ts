// Animal sprite sheets — pre-rendered from 3D models in Blender
// Walk: 8 frames, Idle: 4 frames per animal

export const AnimalSprites = {
  cow: {
    walk: [
      require('./cow_walk_0.png'), require('./cow_walk_1.png'),
      require('./cow_walk_2.png'), require('./cow_walk_3.png'),
      require('./cow_walk_4.png'), require('./cow_walk_5.png'),
      require('./cow_walk_6.png'), require('./cow_walk_7.png'),
    ],
    idle: [
      require('./cow_idle_0.png'), require('./cow_idle_1.png'),
      require('./cow_idle_2.png'), require('./cow_idle_3.png'),
    ],
  },
  sheep: {
    walk: [
      require('./sheep_walk_0.png'), require('./sheep_walk_1.png'),
      require('./sheep_walk_2.png'), require('./sheep_walk_3.png'),
      require('./sheep_walk_4.png'), require('./sheep_walk_5.png'),
      require('./sheep_walk_6.png'), require('./sheep_walk_7.png'),
    ],
    idle: [
      require('./sheep_idle_0.png'), require('./sheep_idle_1.png'),
      require('./sheep_idle_2.png'), require('./sheep_idle_3.png'),
    ],
  },
  pig: {
    walk: [
      require('./pig_walk_0.png'), require('./pig_walk_1.png'),
      require('./pig_walk_2.png'), require('./pig_walk_3.png'),
      require('./pig_walk_4.png'), require('./pig_walk_5.png'),
      require('./pig_walk_6.png'), require('./pig_walk_7.png'),
    ],
    idle: [
      require('./pig_idle_0.png'), require('./pig_idle_1.png'),
      require('./pig_idle_2.png'), require('./pig_idle_3.png'),
    ],
  },
  horse: {
    walk: [
      require('./horse_walk_0.png'), require('./horse_walk_1.png'),
      require('./horse_walk_2.png'), require('./horse_walk_3.png'),
      require('./horse_walk_4.png'), require('./horse_walk_5.png'),
      require('./horse_walk_6.png'), require('./horse_walk_7.png'),
    ],
    idle: [
      require('./horse_idle_0.png'), require('./horse_idle_1.png'),
      require('./horse_idle_2.png'), require('./horse_idle_3.png'),
    ],
  },
} as const;

export type FarmAnimalType = keyof typeof AnimalSprites;
