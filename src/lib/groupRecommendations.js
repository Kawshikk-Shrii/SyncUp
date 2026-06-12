const twoPersonCategories = [
  {
    title: 'Near Person 1',
    intent: 'Good when one person has less travel flexibility.',
    places: [
      ['Neighborhood cafe', 'Low-pressure spot close to the first participant.'],
      ['Casual dining street', 'Easy food options with flexible seating.'],
    ],
  },
  {
    title: 'Midway Picks',
    intent: 'Balanced options around the shared center.',
    places: [
      ['Central coffee house', 'A practical midpoint for a quick meetup.'],
      ['Transit-friendly mall', 'Indoor hangout with food, shopping, and parking.'],
    ],
  },
  {
    title: 'Near Person 2',
    intent: 'Useful when the second participant is hosting or arriving late.',
    places: [
      ['Local dessert spot', 'Shorter travel for the second participant after the plan.'],
      ['Community park', 'Simple open-air option near the second participant.'],
    ],
  },
  {
    title: 'Along the Route',
    intent: 'Places that can work while both people are already travelling.',
    places: [
      ['Route-side food court', 'Convenient stop between both starting points.'],
      ['Metro hub hangout', 'Easy to reach without needing the exact midpoint.'],
    ],
  },
]

const groupCategories = [
  {
    title: 'Best Balanced Picks',
    intent: 'Fair options that avoid favoring only one participant.',
    places: [
      ['Central social cafe', 'Works well for mixed arrival times and group seating.'],
      ['Shared dining district', 'Multiple cuisines so the group has backup choices.'],
    ],
  },
  {
    title: 'Group Center Picks',
    intent: 'Options near the average of everyone’s shared locations.',
    places: [
      ['City-center mall', 'Reliable indoor plan with food and activities.'],
      ['Public plaza cafe cluster', 'Flexible meetup area with several nearby spots.'],
    ],
  },
  {
    title: 'Near Participant Clusters',
    intent: 'Good when several people are starting from the same side of town.',
    places: [
      ['Cluster-side restaurant row', 'Reduces travel for the largest nearby cluster.'],
      ['Campus-adjacent hangout', 'Helpful when many participants are near one area.'],
    ],
  },
  {
    title: 'Popular Hangout Options',
    intent: 'Group-friendly places that are easy to agree on.',
    places: [
      ['Bowling or arcade lounge', 'Activity-first pick for bigger groups.'],
      ['Rooftop or garden cafe', 'Comfortable choice for relaxed group conversations.'],
    ],
  },
]

function calculateCenter(participants) {
  const withCoordinates = participants.filter(
    participant => Number.isFinite(participant.latitude) && Number.isFinite(participant.longitude)
  )

  if (withCoordinates.length === 0) return null

  const total = withCoordinates.reduce(
    (sum, participant) => ({
      latitude: sum.latitude + participant.latitude,
      longitude: sum.longitude + participant.longitude,
    }),
    { latitude: 0, longitude: 0 }
  )

  return {
    latitude: total.latitude / withCoordinates.length,
    longitude: total.longitude / withCoordinates.length,
  }
}

function participantLabel(participants, index) {
  return participants[index]?.name || `Person ${index + 1}`
}

export function buildGroupRecommendations(participants) {
  const locatedParticipants = participants.filter(
    participant => participant.locationText?.trim() || (
      Number.isFinite(participant.latitude) && Number.isFinite(participant.longitude)
    )
  )

  const categories = locatedParticipants.length === 2 ? twoPersonCategories : groupCategories
  const center = calculateCenter(locatedParticipants)

  return {
    center,
    participantCount: locatedParticipants.length,
    categories: categories.map((category, categoryIndex) => ({
      ...category,
      title: category.title
        .replace('Person 1', participantLabel(locatedParticipants, 0))
        .replace('Person 2', participantLabel(locatedParticipants, 1)),
      places: category.places.map(([name, description], placeIndex) => ({
        id: `${category.title}-${placeIndex}`,
        name,
        description,
        query: `${name} ${category.title} hangout`,
        fit:
          categoryIndex === 0
            ? 'Fair for the group'
            : categoryIndex === 1
              ? 'Around shared center'
              : 'Flexible meetup option',
      })),
    })),
  }
}
