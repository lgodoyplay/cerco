export const getPeopleList = (value, fallback = '') => {
  if (Array.isArray(value) && value.length) return value;
  return fallback ? [{ name: fallback, passport: '' }] : [];
};

export const formatPeopleSummary = (people = [], fallback = 'Nao informado') => {
  const validPeople = (Array.isArray(people) ? people : [])
    .map((person) => ({
      name: (person?.name || '').trim(),
      passport: (person?.passport || '').trim()
    }))
    .filter((person) => person.name || person.passport);

  if (!validPeople.length) return fallback;

  return validPeople
    .map((person) => (person.passport ? `${person.name || 'Nao identificado'} (${person.passport})` : person.name))
    .join(', ');
};
