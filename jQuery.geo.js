 /**
 * The jQuery plugin namespace.
 * @external "jQuery" //  not "jQuery.fn"
 * @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
 */
 /**
 * jQuery.geo.js 1.0.0
 *
 * @author ono.koichiro@donuts.ne.jp
 * for GRS80:
 *    '<script src="./jQuery.geo.js">' or '<script src="./jQuery.geo.js?system=GRS80">'
 * for WGS84:
 *    '<script src="./jQuery.geo.js?system=WGS84">'
 */
(function ($) {
    var systems = {
        GRS80 : {
            rx: 6378137.0, /* 赤道半径 */
            if: 298.257222101, /* 逆扁平率 */
        },
        WGS84: {
            rx: 6378137.0, /* 赤道半径 */
            if: 298.257223563, /* 逆扁平率 */
        }
    }
    var SYSTEM, Rx,Ry,FT,E2;
    var scripts = document.getElementsByTagName('script');
    (function (name){
        SYSTEM = systems[name] ? name : 'GRS80'; 
        var system = systems[SYSTEM];
        Rx = system.rx;
        FT = 1 / system.if; /* 扁平率 */
        Ry = Rx * (1 - FT); /* 短半径近似値 */
        E2 = (Rx**2 - Ry**2) / Rx**2; /* 離心率**2 */
    })(scripts[scripts.length - 1].src.replace(/.*?(\?system=|$)/, ''))

    var f = {
        options:
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        success:
            function (position) {
                var coords = position.coords;
                if (!this.funcs) return;
                for (var i in this.funcs) {
                    this.funcs[i](coords.latitude, coords.longitude);
                }
            },
        error:
            function (error) {
                console.log(error);
            },
        radian:
            function (degree) {
                return degree * Math.PI / 180;
            },
    }
    $.extend({
        geo: {
            distance:
                function (coordinate1, coordinate2) {
                    var lat1, lat2;
                    var Dy = (lat1 = f.radian(coordinate1[0])) - (lat2 = f.radian(coordinate2[0])); // 緯度差
                    var Dx = f.radian(coordinate1[1]) - f.radian(coordinate2[1]); // 軽度差
                    var P = (lat1 + lat2) / 2; // 中点緯度
                    var W = Math.sqrt(1 - E2 * (Math.sin(P)**2));
                    var M = Rx * (1 - E2) / W**3; // 子午線曲率半径
                    var N = Rx / W; // 卯酉線曲率半径
                    return Math.sqrt((Dy * M) ** 2 + (Dx * N * Math.cos(P)) ** 2);
                },
            vincenty:
                function (coordinate, alpha1, distance){
                    var lat = f.radian(coordinate[0]);
                    var lng = f.radian(coordinate[1]);
                    alpha1 = f.radian(alpha1);
                    var U1 = Math.atan((1 - FT) * Math.tan(lat));
                    var sigma1 = Math.atan(Math.tan(U1) / Math.cos(alpha1));
                    var alpha = Math.asin(Math.cos(U1) * Math.sin(alpha1));
                    var u2 = Math.cos(alpha)**2 * (Rx**2 - Ry**2) / Ry**2;
                    var A = 1 + u2 /16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
                    var B = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
                    var sigma = distance / Ry / A;
                    var sigma_org;
                    do {
                        sigma_org = sigma;
                        var _2sigmaM = 2 * sigma1 + sigma;
                        sigma = distance / Ry / A
                                + B * Math.sin(sigma) * (
                                    Math.cos(_2sigmaM)
                                    + B / 4 * (
                                        Math.cos(sigma) * (-1 + 2 * Math.cos(_2sigmaM)**2)
                                        - B / 6 * Math.cos(_2sigmaM) * (-3 + 4 * Math.sin(_2sigmaM)**2) * (-3 + 4 * Math.cos(_2sigmaM)**2)));
                    } while(Math.abs(sigma_org - sigma) > 1e-9);
                    var C = (FT / 16) * Math.cos(alpha)**2 * (4 + FT * (4 - 3 * Math.cos(alpha)**2));
                    return [
                        Math.atan(
                            (Math.sin(U1) * Math.cos(sigma) + Math.cos(U1) * Math.sin(sigma) * Math.cos(alpha1))
                            / ((1 - FT) * (Math.sin(alpha)**2 + (Math.sin(U1) * Math.sin(sigma) - Math.cos(U1) * Math.cos(sigma) * Math.cos(alpha1))**2)**(1/2))
                        ) * 180 / Math.PI,
                        (
                            lng
                            + Math.atan(Math.sin(sigma) * Math.sin(alpha1) / (Math.cos(U1) * Math.cos(sigma) - Math.sin(U1) * Math.sin(sigma) * Math.cos(alpha1)))
                                - (1 - C) * FT * Math.sin(alpha) * (sigma + C * Math.sin(sigma) * (Math.cos(_2sigmaM) + C * Math.cos(sigma) * (-1 + 2 * Math.cos(_2sigmaM)**2)))
                        ) * 180 / Math.PI
                    ];
                },
            coordsApply:
                function () {
                    var error = this.error || f.error;
                    var options = this.options || {};
                    navigator.geolocation.getCurrentPosition(
                        f.success.bind({funcs: arguments}),
                        error,
                        $.extend({}, f.options)
                    );
                },
        },
    });

    /*
    $.each(['SYSTEM', 'Ry', 'Rx', 'FT', 'E2'], function (i,v) {
            console.log(v + ': ' + eval(v));
    });
    */
})(jQuery);
