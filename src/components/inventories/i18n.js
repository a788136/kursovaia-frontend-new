// src/components/inventories/i18n.js
export const MESSAGES = {
  ru: {
    title: 'Инвентаризации',
    searchPlaceholder: 'Поиск (название, автор, тег)…',
    create: 'Создать',
    creating: 'Создаём…',
    loading: 'Загрузка…',
    errorLoading: 'Не удалось загрузить инвентаризации',
    empty: 'Ничего не найдено',
    sortBy: 'Сортировка',
    name: 'Название',
    owner: 'Автор',
    description: 'Описание',
    updated: 'Обновлено',
    created: 'Создано',
    image: 'Картинка',
  },
  en: {
    title: 'Inventories',
    searchPlaceholder: 'Search (name, owner, tag)…',
    create: 'Create',
    creating: 'Creating…',
    loading: 'Loading…',
    errorLoading: 'Failed to load inventories',
    empty: 'Nothing found',
    sortBy: 'Sort',
    name: 'Name',
    owner: 'Owner',
    description: 'Description',
    updated: 'Updated',
    created: 'Created',
    image: 'Image',
  },
};

export function useI18n(langProp, tProp) {
  const lang = (langProp || localStorage.getItem('lang') || 'ru')
    .toLowerCase()
    .startsWith('en') ? 'en' : 'ru';

  const fallbackT = (key) => MESSAGES[lang]?.[key] ?? key;
  const t = (key) => {
    const fromApp = tProp?.[lang]?.[key];
    return fromApp ?? fallbackT(key);
  };

  return { lang, t };
}
