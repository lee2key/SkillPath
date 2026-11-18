"""Original SVG teaching diagrams; intentionally labelled as diagrams, not MD UI."""
from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parents[1]/'content/assets/md-basics'
OUT.mkdir(parents=True,exist_ok=True)
INK='#243746'; TEAL='#117f83'; ORANGE='#d77b24'
def text(x,y,s,size=25,color=INK,anchor='start'):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(s)}</text>'
def rect(x,y,w,h,fill='#d7efed',stroke=TEAL,r=8):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="3"/>'
def line(x,y,xx,yy,color=INK,dash=False):
    return f'<path d="M{x},{y} L{xx},{yy}" fill="none" stroke="{color}" stroke-width="4"'+(' stroke-dasharray="10 8"' if dash else '')+'/>'
def poly(points,fill='#d7efed',stroke=TEAL):
    return f'<polygon points="{points}" fill="{fill}" stroke="{stroke}" stroke-width="4"/>'
def circle(x,y,r=7,color=ORANGE): return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'
def arrow(x,y,xx,yy,color=INK):
    return line(x,y,xx,yy,color)+f'<path d="M{xx-10},{yy-7} L{xx},{yy} L{xx-10},{yy+7}" fill="none" stroke="{color}" stroke-width="3"/>'
def save(name,title,body,foot):
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 560" role="img"><title>{escape(title)}</title><desc>{escape(foot)}</desc><rect width="960" height="560" rx="20" fill="#f3f7f8"/><g font-family="Segoe UI,Arial,sans-serif">{rect(0,0,960,88,INK,INK,0)}{text(34,55,title,30,"#fff")}{body}{line(30,495,930,495,"#d3dfe4")}{text(32,532,"Учебная схема · "+foot,20)}</g></svg>'
    (OUT/(name+'.svg')).write_text(svg,encoding='utf-8')

b=''
for x,n,label in [(35,'01','Лекала'),(270,'02','Размещение'),(505,'03','Швы'),(740,'04','Simulation')]:
    b+=rect(x,150,185,240,'#fff','#d3dfe4')+text(x+20,190,n,24,TEAL)+text(x+92,355,label,23,INK,'middle')
    if n=='01': b+=rect(x+30,220,50,90)+rect(x+100,220,50,90)
    if n=='02': b+=rect(x+70,220,45,90,'#e0e5e9','#82939f')+line(x+40,220,x+40,310,TEAL)+line(x+145,220,x+145,310,ORANGE)
    if n=='03': b+=rect(x+25,220,50,90)+rect(x+110,220,50,90)+line(x+75,230,x+110,230,ORANGE,True)+line(x+75,300,x+110,300,ORANGE,True)
    if n=='04': b+=poly(f'{x+50},220 {x+135},220 {x+150},310 {x+35},310')+line(x+75,225,x+65,305,TEAL)
    if x<740:b+=arrow(x+190,270,x+228,270)
save('workflow','Как плоские детали становятся одеждой',b,'Повторяйте цикл после правки формы')

b=rect(35,125,100,310,'#fff','#becdd4')+text(45,165,'Library',20)+rect(155,125,285,310)+rect(460,125,285,310,'#fff','#becdd4')+rect(765,125,165,140,'#fff','#becdd4')+rect(765,285,165,150,'#fff','#becdd4')
b+=text(175,165,'3D Window',26)+text(480,165,'2D Pattern',26)+text(780,165,'Object',22)+text(780,193,'Browser',22)+text(780,325,'Property',22)+text(780,353,'Editor',22)
b+=poly('245,220 350,220 380,390 220,390')+rect(490,225,95,160)+rect(615,225,95,160)+text(175,462,'Примерка',24)+text(480,462,'Контур и швы',24)
save('workspace','Карта рабочего пространства',b,'Схема расположения, не скриншот интерфейса')

b=''
for x,label,note in [(80,'Front','Симметрия'),(365,'Side','Зазор'),(650,'Back','Задняя сторона')]:
    b+=rect(x,135,230,300,'#fff','#d3dfe4')+text(x+115,180,label,28,TEAL,'middle')
    b+=poly(f'{x+80},225 {x+150},225 {x+175},345 {x+55},345')+text(x+115,400,note,22,INK,'middle')
b+=text(480,475,'Камера двигается — лекало не меняется',25,INK,'middle')
save('views','Три ракурса для проверки',b,'Проверяйте одежду со всех сторон')

b=text(210,145,'Вид сбоку',28)+rect(360,180,170,245,'#dce3e8','#8a9ba7',60)+text(445,310,'Avatar',26,INK,'middle')+line(265,190,265,430,TEAL)+line(625,190,625,430,ORANGE)+text(190,465,'Перед',25,TEAL)+text(585,465,'Спинка',25,ORANGE)+arrow(275,270,350,270)+arrow(540,270,615,270)+text(45,210,'Снаружи',23,TEAL)+text(690,210,'Снаружи',23,ORANGE)+text(682,265,'Без пересечений',22)
save('arrangement','Размещение перед Simulation',b,'Arrangement Points — только стартовая позиция')

b=''
for y,name,note in [(155,'01_start.zprj','Avatar и пустая сцена'),(260,'02_patterns.zprj','Лекала готовы'),(365,'03_sewn.zprj','Проверенные швы')]:
    b+=rect(50,y,370,75,'#fff','#becdd4')+text(72,y+48,name,26,TEAL)+arrow(440,y+38,490,y+38)+text(515,y+48,note,25)
save('save','Save As: сохраняйте этапы',b,'OBJ не заменяет редактируемый Project (.zprj)')

b=rect(140,185,235,240)+rect(570,185,235,240)+text(257,155,'550 mm',26,TEAL,'middle')+text(687,155,'550 mm',26,TEAL,'middle')+text(45,310,'500',25)+text(45,342,'mm',22)+text(257,465,'Перед',25,INK,'middle')+text(687,465,'Спинка',25,INK,'middle')+text(470,320,'+',38)+text(480,115,'550 + 550 = 1100 mm по окружности',22,INK,'middle')
save('rectangle','Rectangle: два полотнища',b,'Размеры примерные; подбирайте под свой Avatar')

b=poly('300,200 660,200 745,420 215,420')
for x,y,n in [(300,200,'1'),(660,200,'2'),(745,420,'3'),(215,420,'4')]: b+=circle(x,y)+text(x+15,y-15,n,24,ORANGE)
b+=text(480,165,'Верх уже низа',27,INK,'middle')+text(480,465,'Замкните контур: 1 → 2 → 3 → 4 → 1',25,INK,'middle')
save('polygon','Polygon: четыре точки — одна деталь',b,'Контур не должен пересекать сам себя')

b=poly('90,185 310,185 350,405 50,405')+poly('600,185 820,185 900,405 560,405')+circle(350,405)+circle(900,405)+arrow(390,290,520,290)+text(205,455,'До',26,INK,'middle')+text(740,455,'После: угол наружу',25,INK,'middle')+text(480,135,'Edit Pattern → точка → небольшое перемещение',25,INK,'middle')
save('edit','Меняйте форму, а не положение',b,'Transform Pattern двигает всю деталь')

b=poly('80,195 315,195 345,390 50,390')+poly('610,195 845,195 875,390 580,390')+line(465,150,465,425,'#90a4af',True)+circle(80,195)+circle(845,195)+text(465,465,'Изменение одной стороны отражается на другой',24,INK,'middle')+text(465,135,'Symmetric Pattern (with Sewing)',28,TEAL,'middle')
save('symmetry','Связанная зеркальная пара',b,'Перед и спинка не обязаны быть зеркальными')

b=rect(75,195,235,225)+rect(620,195,235,225)+text(185,160,'Перед',27,TEAL,'middle')+text(735,160,'Спинка',27,TEAL,'middle')+line(310,195,620,195,ORANGE,True)+line(310,420,620,420,ORANGE,True)+text(465,260,'Верх ↔ верх',25,INK,'middle')+text(465,355,'Низ ↔ низ',25,INK,'middle')+text(465,465,'Соединяем соответствующие боковые края',23,INK,'middle')
save('sewing','Segment Sewing: проверьте направление',b,'Здесь показана одна пара боковых краёв')

b=poly('310,185 650,185 720,425 240,425')+line(310,190,240,425,TEAL)+line(650,190,720,425,TEAL)
for x in [325,350,610,635]: b+=circle(x,185,8,ORANGE)
b+=text(480,145,'Верх открыт; временные Pin',26,ORANGE,'middle')+text(480,465,'Подол открыт',26,INK,'middle')+text(40,310,'Боковой',23)+text(40,340,'шов',23)+text(765,310,'Боковой',23)+text(765,340,'шов',23)
save('skirt','Учебная юбка: что соединяем',b,'Pin держит ткань в пространстве; это не пояс')

b=rect(95,200,280,190)+rect(575,200,300,190)+text(235,160,'Версия A',27,INK,'middle')+text(725,160,'Версия B',27,INK,'middle')+text(235,285,'520 + 520',30,TEAL,'middle')+text(235,335,'1040 mm',28,INK,'middle')+text(725,285,'540 + 540',30,TEAL,'middle')+text(725,335,'1080 mm',28,INK,'middle')+arrow(410,290,540,290)+text(480,450,'+40 mm к общей окружности',27,ORANGE,'middle')
save('fit','Посадка: меняйте только один фактор',b,'Одинаковые Avatar, Fabric, Pin и ракурс')

b=rect(55,155,390,280,'#fff','#becdd4')+rect(515,155,390,280,'#fff','#becdd4')+text(250,210,'Color / Texture',28,TEAL,'middle')+text(710,210,'Physical Property',28,TEAL,'middle')+circle(180,290,32,'#3e83b6')+circle(320,290,32,ORANGE)+text(250,385,'Внешний вид',27,INK,'middle')+text(710,285,'Stretch · Bending',25,INK,'middle')+text(710,385,'Поведение ткани',27,INK,'middle')
save('fabric','У Fabric есть вид и физика',b,'Для честного сравнения меняйте один параметр')

b=''
for x,step,label in [(70,60,'20 mm'),(380,30,'10 mm'),(690,15,'5 mm')]:
    b+=rect(x,190,210,210,'#fff','#becdd4')
    for t in range(step,210,step): b+=line(x+t,190,x+t,400,TEAL)+line(x,190+t,x+210,190+t,TEAL)
    b+=text(x+105,155,label,27,INK,'middle')
b+=text(480,455,'Плотнее сетка → больше расчётов',27,ORANGE,'middle')
save('mesh','Particle Distance: плотность сетки',b,'Сетка условная; это не снимок сетки MD')

b=poly('290,165 670,165 735,430 225,430')+line(240,385,720,385,ORANGE,True)+text(480,310,'Одно лекало',30,TEAL,'middle')+text(480,365,'Internal Line',25,ORANGE,'middle')+text(480,470,'Контур не разрезан',24,INK,'middle')
save('internal','Внутренняя линия ≠ разрез',b,'Cut и Cut and Sew — отдельные действия')

# Front/back pattern shapes and colour-coded seam regions.
b=''
for dx,title in [(0,'Перед'),(470,'Спинка')]:
    pts=[(80,430),(80,275),(115,225),(125,170),(195,145),(220,205),(260,205),(285,145),(355,170),(365,225),(400,275),(400,430)]
    b+=poly(' '.join(f'{x+dx},{y}' for x,y in pts))
    b+=line(80+dx,275,80+dx,430,ORANGE)+line(400+dx,275,400+dx,430,ORANGE)+line(125+dx,170,195+dx,145,ORANGE)+line(285+dx,145,355+dx,170,ORANGE)+text(240+dx,330,title,28,TEAL,'middle')
b+=text(480,470,'Оранжевые края: плечи и бока → Sewing',24,ORANGE,'middle')
save('top','Верх без рукавов: карта швов',b,'Горловину, проймы и низ оставьте открытыми')

b=rect(45,170,260,220,'#fff','#becdd4')+text(175,230,'.zprj',36,TEAL,'middle')+text(175,290,'Редактирование',23,INK,'middle')+text(175,330,'лекал',23,INK,'middle')+rect(360,170,255,220,'#fff','#becdd4')+text(487,230,'.obj + .mtl',29,ORANGE,'middle')+text(487,290,'Геометрия',24,INK,'middle')+text(487,330,'и материалы',24,INK,'middle')+rect(670,170,245,220,'#fff','#becdd4')+text(792,230,'Импорт',30,TEAL,'middle')+text(792,290,'Размер',24,INK,'middle')+text(792,330,'Ориентация',24,INK,'middle')+arrow(310,280,350,280)+arrow(620,280,660,280)+text(480,460,'Храните Texture рядом с экспортом',25,INK,'middle')
save('export','Сохранить проект → экспортировать → проверить',b,'Проверяйте OBJ в принимающем приложении')
print('Created',len(list(OUT.glob('*.svg'))),'original diagrams')
