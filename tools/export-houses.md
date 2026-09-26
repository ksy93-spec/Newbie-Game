# 거처 그림 굽기

거처 열 단계는 프로토타입(`prototype/newbie-quest-demo.html`)의 `houseG()`가 그린다.
앱에는 Skia로 다시 짜는 대신 그 결과를 PNG로 구워서 넣었다. 그림이 하나라야
프로토타입과 앱이 안 갈라진다.

프로토타입을 브라우저로 열고 콘솔에서:

```js
TIERS.forEach((t, i) => {
  const a = document.createElement('a');
  a.download = `house_${i}.png`;          // 노숙 0 … 내 집 9
  a.href = houseCv(i).toDataURL();
  a.click();
});
```

받은 파일을 `assets/sprites/`에 넣고, 크기가 바뀌었으면
`src/sprite/cast.ts`의 `HOUSE` 표에 있는 `w`·`h`도 같이 고친다.
`npm test`의 "거처는 열 단계가 모두 다른 그림이다"가 파일 존재와 개수를 확인한다.
