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
    var SYSTEM, Rx,Ry,IF,E2;
    var scripts = document.getElementsByTagName('script');
    (function (name){
        SYSTEM = systems[name] ? name : 'GRS80'; 
        var system = systems[SYSTEM];
        Rx = system.rx;
        IF = system.if;
        Ry = Rx * (IF - 1) / IF; /* 短半径近似値 */
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
                function (coordinate1, distance, direction) {
                    console.log(E2);
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

    $.each(['SYSTEM', 'Ry', 'Rx', 'IF', 'E2'], function (i,v) {
            console.log(v + ': ' + eval(v));
    });
})(jQuery);
