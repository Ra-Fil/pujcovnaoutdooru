const OpenSansFontData = "base64_encoded_font_data_here";
jsPDF.API.addFileToVFS("OpenSans-Regular.ttf", OpenSansFontData);
jsPDF.API.addFont("OpenSans-Regular.ttf", "OpenSans", "regular");