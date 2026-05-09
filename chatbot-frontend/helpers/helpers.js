import * as moment from 'jalali-moment';

export const christianToPersianDate = (text) => {
  if(text == null) return "";
  return moment(text.split('T'), "YYYY/MM/DD").locale("fa").format("YYYY/MM/DD");
}

export const christianToPersianDateTime = (text) => {
  if (text == null) return "";
  return moment(text)
    .locale("fa")
    .format("YYYY/MM/DD HH:mm:ss");
}

export const persianToChristianDate = (
  text
) => {
  if (!text) return null;
  console.log("here is date:" , text)
  return moment(text, "jYYYY/jMM/jDD").set({ hour: 0, minute: 0, second: 0 }).locale("en").add(1 , 'days').toDate();
};

export const convertBotName = (text) => {
  if(text == 'main') return "اصلی"
  return 'نا مشخص'
}




