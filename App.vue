<script>
import { ddp } from "./modules/core/ddp";
ddp.subscribe("rooms.all")
ddp.subscribe("rooms.mine")
export default {
	onLaunch: function () {
		console.log("App Launch");
	},
	onShow: function () {
		console.log("App Show");
	},
	onHide: function () {
		console.log("App Hide");
	},
};
</script>

<style>
/*每个页面公共css */
page {
	display: flex;
	flex-direction: column;
	/*
	min-height: 100%; */
	background-color: #eeeeff;
	min-height: 100%;
}
page-body {
	background-color: red;
}
.frow,
.fcol {
	display: flex;
}

.frow {
	flex-direction: row;
}

.fcol {
	flex-direction: column;
}

.fcnt,
.cntx {
	justify-content: center;
}

.fcnt,
.cnty {
	align-items: center;
}

.fbtw {
	justify-content: space-between;
}

.fsc {
	align-self: center;
}

.fse {
	align-self: flex-end;
}

.fss {
	align-self: flex-start;
}

.pd {
	padding: 0.5rem;
}

.pdh {
	padding: 0.5rem 0;
}
.f1 {
	flex: 1;
}
.pdv {
	padding: 0 0.5rem;
}

.mg {
	margin: 0.5rem;
}

.mgh {
	margin: 0.5rem 0;
}

.mgv {
	margin: 0 0.5rem;
}

.mgt {
	margin-top: 0.5rem;
}

.mgb {
	margin-bottom: 0.5rem;
}
</style>
