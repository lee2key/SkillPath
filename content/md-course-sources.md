# Marvelous Designer: редакционная справка

Обновлено 2 ноября 2026. Целевая версия — MD 2026. Объяснения на русском, названия команд и параметров на English. Сохранены исходные ID уроков, разделы и вопросы автора.

## Исследованные программы

- [Официальный Quick Start](https://support.marvelousdesigner.com/hc/en-us/sections/47114858062233-Quick-Start): интерфейс, камера, файлы, лекала, размещение, шитьё, ткань и завершение.
- [Patata School — The Ultimate Marvelous Designer Course](https://courses.patataschool.com/the-ultimate-marvelous-designer-course): переход от рабочего пространства к проектам одежды и экспорту; сочетание практики и вопросов.
- [Domestika — Clothing Design with Marvelous Designer](https://www.domestika.org/en/courses/805-clothing-design-with-marvelous-designer): знакомство с инструментами до построения, материалов и экспорта.

Использованы публичные программы для сравнения структуры. Платные уроки, тексты и файлы этих курсов не копировались. Примеры размеров, упражнения, объяснения и SVG-схемы написаны для данного курса. Продвинутая анимация, rigging, внешние рендереры и сложная фурнитура не являются обязательными для начинающих.

## Техническая проверка

Каждый урок содержит ссылку на соответствующую официальную справку. Дополнительно проверены:

- [MD 2026.0 New Feature List](https://support.marvelousdesigner.com/hc/en-us/articles/55837641308313-Marvelous-Designer-2026-0-New-Feature-List).
- [Linked Editing](https://support.marvelousdesigner.com/hc/en-us/articles/47358366174233-Linked-Editing).
- [Pins](https://support.marvelousdesigner.com/hc/en-us/articles/47358146159769-Pins).
- [Set View Control](https://support.marvelousdesigner.com/hc/en-us/articles/47358287009049-Set-View-Control-Above-ver-8).

Это проверка по документации, а не выполнение упражнений внутри установленного MD 2026. Скриншоты более раннего интерфейса явно обозначены как справочные. Конкретная сборка MD, Preset камеры и установленная библиотека могут менять расположение элементов и доступные ресурсы.

## Изображения и происхождение

Все `content/assets/md-basics/*.svg` — оригинальные учебные схемы, не имитация снимков интерфейса. Размеры и сетка условные; схемы подписаны.

`fabric-presets.jpg` — официальная иллюстрация [Physical Property Preset](https://support.marvelousdesigner.com/hc/en-us/articles/47358440962713-FABRIC-PHYSICAL-PROPERTIES-Physical-Property-Preset), Marvelous Designer Help Center.

Остальные используемые PNG — фрагменты интерфейса из официального руководства Epic Games [Making a Sweater with Marvelous Designer](https://dev.epicgames.com/documentation/fortnite/making-a-sweater-with-marvelous-designer-in-unreal-editor-for-fortnite). Их владельцем остаётся соответствующий правообладатель. Атрибуция и ссылка указаны на каждом экране с таким изображением. Это справочные изображения инструментов, а не утверждение, что автор курса смоделировал показанный свитер.

Снимок `export-menu.png` показывает меню форматов и выделенный в оригинальном руководстве USD. Подпись прямо указывает выбрать OBJ для нашего упражнения. Изображение Import OBJ не использовано как иллюстрация Export.

Машиночитаемый список файлов и исходных адресов: `md-media-sources.json`. Основной учебный текст, SVG и снимки включаются в офлайн-релиз. Интернет нужен только для перехода к внешним источникам.

## Обновление контента

Редактируйте `courses.json` через админку. Скрипт `scripts/enrich-md-course.py` — редакционная заготовка этого обновления: его повторный запуск заменит теоретические экраны 20 уроков. Не запускайте его после ручных правок без резервной копии. `scripts/draw-md-diagrams.py` пересоздаёт авторские SVG. Скрипты research/fetch использовались для исследования и загрузки, они не нужны ученику или для запуска приложения.
