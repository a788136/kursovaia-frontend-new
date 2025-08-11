import React from 'react';

export default function TooltipsHelp() {
  return (
    <div style={{ fontSize: 14 }}>
      <h4>Подсказки и валидация</h4>
      <ul>
        <li>Ключ поля: латиница, цифры и подчёркивания, должен быть уникальным.</li>
        <li>Лимиты: до 3 полей каждого типа, всего до 15.</li>
        <li>Custom ID: собирайте из блоков, используйте разделитель для читаемости.</li>
      </ul>
    </div>
  );
}
